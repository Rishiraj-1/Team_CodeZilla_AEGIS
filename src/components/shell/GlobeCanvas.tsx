'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAegis } from '@/context/AegisContext';
import { objectTypeColor } from '@/lib/utils';
import * as THREE from 'three';
import * as satellite from 'satellite.js';
import { HISTORICAL_EVENTS, propagateHistorical } from '@/lib/historical-data';

// Dynamic import for globe.gl (no SSR)
let Globe: any = null;

interface GlobeCanvasProps {
  selectedObjectId?: string | null;
  onObjectSelect?: (objectId: string | null) => void;
}

export default function GlobeCanvas({ selectedObjectId, onObjectSelect }: GlobeCanvasProps) {
  const pathname = usePathname();
  const router = useRouter();
  const globeRef = useRef<any>(null);
  const [GlobeComponent, setGlobeComponent] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [pulseToggler, setPulseToggler] = useState(true);
  
  const { 
    objects, 
    conjunctions,
    selectedObjectId: contextSelectedObjectId,
    setSelectedObjectId: contextSetSelectedObjectId,
    hasEntered,
    isTransitioning,
    simulationDate,
    activeEvent,
    regime
  } = useAegis();

  const activeSelectedObjectId = selectedObjectId !== undefined ? selectedObjectId : contextSelectedObjectId;
  const activeOnObjectSelect = onObjectSelect || contextSetSelectedObjectId;

  const [trailMinutes, setTrailMinutes] = useState(30);

  // Load globe component, start timer, and load trail configuration
  useEffect(() => {
    setMounted(true);
    import('react-globe.gl').then((mod) => {
      setGlobeComponent(() => mod.default);
    });

    const interval = setInterval(() => {
      setPulseToggler(p => !p);
    }, 400);

    const trail = localStorage.getItem('aegis-trail-length');
    if (trail) setTrailMinutes(parseInt(trail));

    const handleTrailChange = (e: Event) => {
      setTrailMinutes((e as CustomEvent).detail);
    };

    window.addEventListener('aegis-trail-change', handleTrailChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('aegis-trail-change', handleTrailChange);
    };
  }, []);

  // Set camera positions on mount/route changes
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();

    if (pathname === '/') {
      // Zoom out on landing page
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 3.5 }, 0);
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.6; // faster spin for landing page
      }
    } else {
      // Zoom in on dashboard page
      globeRef.current.pointOfView({ lat: 22, lng: -40, altitude: 2.1 }, 0);
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.12; // slow drift for dashboard
      }
    }
  }, [pathname]);

  // Handle active entry transition zoom animation
  useEffect(() => {
    if (isTransitioning && globeRef.current) {
      globeRef.current.pointOfView({ lat: 22, lng: -40, altitude: 2.1 }, 2000);
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.12;
      }
    }
  }, [isTransitioning]);

  // Auto-focus on highest threat when the threat list changes
  useEffect(() => {
    if (!globeRef.current) return;
    const topThreat = conjunctions
      .filter(c => c.status !== 'RESOLVED' && c.defcon <= 2)
      .sort((a, b) => {
        if (a.defcon !== b.defcon) return a.defcon - b.defcon;
        return b.collisionPc - a.collisionPc;
      })[0];

    if (!topThreat) return;

    const midLat = (topThreat.primary.lat + topThreat.secondary.lat) / 2;
    const midLng = (topThreat.primary.lng + topThreat.secondary.lng) / 2;

    globeRef.current.pointOfView(
      { lat: midLat, lng: midLng, altitude: 1.8 },
      2000
    );
  }, [conjunctions.map(c => c.id).join(',')]);

  // Respond to manual/tour threat focus events
  useEffect(() => {
    const handleFocusEvent = (e: Event) => {
      const threatId = (e as CustomEvent).detail;
      const threat = conjunctions.find(c => c.id === threatId);
      if (threat && globeRef.current) {
        const midLat = (threat.primary.lat + threat.secondary.lat) / 2;
        const midLng = (threat.primary.lng + threat.secondary.lng) / 2;
        globeRef.current.pointOfView(
          { lat: midLat, lng: midLng, altitude: 1.8 },
          2000
        );
      }
    };

    window.addEventListener('aegis-focus-threat', handleFocusEvent);
    return () => window.removeEventListener('aegis-focus-threat', handleFocusEvent);
  }, [conjunctions]);

  // Regime camera zooming
  useEffect(() => {
    if (!globeRef.current) return;
    switch (regime) {
      case 'LEO':
        globeRef.current.pointOfView({ altitude: 1.4 }, 1500);
        break;
      case 'MEO':
        globeRef.current.pointOfView({ altitude: 2.2 }, 1500);
        break;
      case 'GEO':
        globeRef.current.pointOfView({ altitude: 3.8 }, 1500);
        break;
      case 'ALL':
      default:
        if (pathname !== '/') {
          globeRef.current.pointOfView({ altitude: 2.1 }, 1500);
        }
        break;
    }
  }, [regime, pathname]);

  // Globe initialization
  const handleGlobeReady = useCallback(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = pathname === '/' ? 0.6 : 0.12;
      controls.enableZoom = true;
      controls.zoomSpeed = 0.8;
      controls.minDistance = 150;
      controls.maxDistance = 600;

      // Pause auto-rotate on user interaction
      controls.addEventListener('start', () => {
        controls.autoRotate = false;
      });
      controls.addEventListener('end', () => {
        setTimeout(() => {
          if (globeRef.current) {
            const currentControls = globeRef.current.controls();
            if (currentControls) currentControls.autoRotate = true;
          }
        }, 5000);
      });
    }

    const renderer = globeRef.current.renderer();
    if (renderer) {
      renderer.antialias = true;
      // Configure for 4K / Retina resolution (pixel-perfect clarity)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    const scene = globeRef.current.scene();
    if (scene) {
      scene.background = null;

      // Add a warm gold directional light pointing at the atmospheric edge for premium depth
      const dirLight = new THREE.DirectionalLight(0xffc200, 0.4);
      dirLight.position.set(-200, 100, -100);
      scene.add(dirLight);

      // Create a 3D starfield particle system (replaces low-res stretched image)
      const starsGeometry = new THREE.BufferGeometry();
      const starsCount = 3000;
      const starPositions = new Float32Array(starsCount * 3);
      const starColors = new Float32Array(starsCount * 3);
      
      for (let i = 0; i < starsCount * 3; i += 3) {
        const theta = Math.random() * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * Math.random() - 1.0);
        const r = 320 + Math.random() * 180;
        
        starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
        starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPositions[i + 2] = r * Math.cos(phi);
        
        // Randomize star brightness / color temperatures (white, pale amber, pale blue)
        const brightness = 0.3 + Math.random() * 0.7;
        const randColor = Math.random();
        if (randColor > 0.85) {
          // Gold/Amber star
          starColors[i] = brightness;
          starColors[i + 1] = brightness * 0.85;
          starColors[i + 2] = brightness * 0.55;
        } else if (randColor < 0.15) {
          // Pale blue star
          starColors[i] = brightness * 0.8;
          starColors[i + 1] = brightness * 0.9;
          starColors[i + 2] = brightness;
        } else {
          // White star
          starColors[i] = brightness;
          starColors[i + 1] = brightness;
          starColors[i + 2] = brightness;
        }
      }
      
      starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      starsGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
      
      const starsMaterial = new THREE.PointsMaterial({
        size: 1.4,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      
      const starField = new THREE.Points(starsGeometry, starsMaterial);
      scene.add(starField);

      // Configure anisotropic texture filtering on the Earth mesh to prevent horizon blurring
      scene.traverse((obj: any) => {
        if (obj.isMesh && obj.material) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach((mat: any) => {
            if (mat.map) {
              mat.map.anisotropy = 16;
              mat.map.needsUpdate = true;
            }
          });
        }
      });
    }

    if (pathname === '/') {
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 3.5 }, 0);
    } else {
      globeRef.current.pointOfView({ lat: 22, lng: -40, altitude: 2.1 }, 0);
    }
  }, [pathname]);

  // Determine opacity/filter based on route
  const getGlobeStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      width: '100vw',
      height: '100vh',
      transition: 'opacity var(--ms-3) var(--ease), filter var(--ms-3) var(--ease)',
      // Premium 4K background gradient and film grain noise overlay
      backgroundImage: `
        radial-gradient(ellipse at center, #080602 0%, #030201 65%, #000000 100%),
        url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.012'/%3E%3C/svg%3E")
      `,
    };

    switch (pathname) {
      case '/analytics':
        return { ...base, opacity: 0.22, filter: 'none' }; // Increased opacity for heatmap visual clarity
      case '/objects':
        return { ...base, opacity: 0.6 };
      case '/chat':
        return { ...base, opacity: 0.3 };
      case '/threats':
      default:
        return { ...base, opacity: 1 };
    }
  };

  const showDebris = hasEntered || isTransitioning || pathname !== '/';

  // Identify AEGIS-flagged (involved in conjunction) and Flashing (TCA near simulator/now time) objects
  const { flaggedObjectIds, flashObjectIds } = useMemo(() => {
    const flagged = new Set<string>();
    const flash = new Set<string>();
    
    const nowMs = simulationDate ? simulationDate.getTime() : Date.now();

    conjunctions.forEach((c) => {
      if (c.primary) flagged.add(c.primary.id);
      if (c.secondary) flagged.add(c.secondary.id);
      
      const tcaMs = new Date(c.tca).getTime();
      // Flash if closest approach is within 15 minutes of current clock time
      if (Math.abs(tcaMs - nowMs) < 15 * 60 * 1000) {
        if (c.primary) flash.add(c.primary.id);
        if (c.secondary) flash.add(c.secondary.id);
      }
    });

    return { flaggedObjectIds: flagged, flashObjectIds: flash };
  }, [conjunctions, simulationDate]);

  // Density Heatmap shell data
  const heatmapShells = useMemo(() => {
    if (pathname !== '/analytics') return [];
    return [
      { isShell: true, altitude: 400 / 6371 / 2.5, color: '#ff3030', label: 'ISS DANGER ZONE (400-600km)', desc: 'High density, crewed assets corridor' },
      { isShell: true, altitude: 550 / 6371 / 2.5, color: '#ffc200', label: 'STARLINK REGIME SHELL (550km)', desc: 'Megaconstellation operations zone' },
      { isShell: true, altitude: 800 / 6371 / 2.5, color: '#ff0000', label: 'DEBRIS CONGESTION CORE (800km)', desc: 'Peak debris population shell' },
    ];
  }, [pathname]);

  // Filter objects to keep only active, high-risk, or conjunction involved targets, capped at 2000
  const renderableObjects = useMemo(() => {
    const conjunctionNoradIds = new Set(
      conjunctions.flatMap(c => [c.primary.noradId, c.secondary.noradId])
    );

    return objects.filter(obj =>
      obj.status === 'ACTIVE' ||
      obj.riskScore > 40 ||
      conjunctionNoradIds.has(obj.noradId)
    ).slice(0, 2000);
  }, [objects, conjunctions]);

  // Satellite and debris data for the globe custom layers
  const pointsData = showDebris
    ? [
        ...renderableObjects.map((obj) => {
          const isFlagged = flaggedObjectIds.has(obj.id);
          const isFlashing = flashObjectIds.has(obj.id);
          
          let color = '#7a6a3a';
          if (isFlashing) {
            color = '#ffffff'; // White/Red flash
          } else if (isFlagged) {
            color = '#ffc200'; // Yellow: AEGIS-flagged
          } else if (obj.type === 'DEBRIS') {
            color = '#ff3030'; // Red: debris
          } else if (obj.type === 'PAYLOAD') {
            color = '#2ed87a'; // Green: active satellite
          } else if (obj.type === 'ROCKET_BODY') {
            color = '#e07a5f'; // Amber: rocket bodies
          }

          return {
            lat: obj.lat,
            lng: obj.lng,
            altitude: obj.altitude / 6371 / 2.5,
            color,
            isFlashing,
            isFlagged,
            isShell: false,
            size: obj.id === activeSelectedObjectId
              ? 1.5
              : isFlagged
                ? 1.2
                : (obj.type === 'DEBRIS' ? 0.55 : 0.8),
            name: obj.name,
            id: obj.id,
            type: obj.type,
            noradId: obj.noradId,
            altitudeKm: obj.altitude,
          };
        }),
        ...heatmapShells.map((shell, i) => ({
          lat: 0,
          lng: i * 120, // distribute around equator
          altitude: shell.altitude,
          color: shell.color,
          isFlashing: false,
          isFlagged: false,
          isShell: true,
          size: 0.1, // tiny dot anchor
          name: shell.label,
          id: `shell-${i}`,
          type: 'SHELL',
          noradId: 0,
          altitudeKm: shell.altitude * 6371 * 2.5,
          label: shell.label,
          desc: shell.desc,
        }))
      ]
    : [];

  // Generate dynamic orbital trails for active selected + flagged objects
  const trailsData = useMemo(() => {
    if (!showDebris) return [];

    const targetObjects = objects.filter(obj => 
      obj.id === activeSelectedObjectId || flaggedObjectIds.has(obj.id)
    );

    const targetDate = simulationDate || new Date();
    
    // Scale step size dynamically to keep a high-quality balance of resolution vs performance (target ~15 points)
    const stepSize = Math.max(1, Math.floor(trailMinutes / 20));

    return targetObjects.map(obj => {
      const points: [number, number, number][] = [];

      if (activeEvent !== 'LIVE') {
        const event = HISTORICAL_EVENTS.find(e => e.id === activeEvent);
        const tcaTime = event ? event.tca.getTime() : Date.now();
        const baseTime = targetDate.getTime();

        for (let m = trailMinutes; m >= 0; m -= stepSize) {
          const stepTime = new Date(baseTime - m * 60 * 1000);
          const deltaT = (stepTime.getTime() - tcaTime) / 1000;
          if (activeEvent !== 'ISS_NEARMISS' && deltaT > 0) {
            continue;
          }
          const prop = propagateHistorical(activeEvent, stepTime);
          const found = prop.find(o => o.id === obj.id || o.name === obj.name);
          if (found) {
            points.push([found.lat, found.lng, found.altitude / 6371 / 2.5]);
          }
        }
      } else if (obj.tle1 && obj.tle2) {
        try {
          const satrec = satellite.twoline2satrec(obj.tle1, obj.tle2);
          for (let m = trailMinutes; m >= 0; m -= stepSize) {
            const stepTime = new Date(targetDate.getTime() - m * 60 * 1000);
            const posAndVel = satellite.propagate(satrec, stepTime);
            if (posAndVel && posAndVel.position) {
              const pos = posAndVel.position as satellite.EciVec3<number>;
              if (pos && typeof pos !== 'boolean') {
                const gmst = satellite.gstime(stepTime);
                const geo = satellite.eciToGeodetic(pos, gmst);
                points.push([
                  satellite.degreesLat(geo.latitude),
                  satellite.degreesLong(geo.longitude),
                  geo.height / 6371 / 2.5
                ]);
              }
            }
          }
        } catch {}
      }

      return {
        id: obj.id,
        points,
        color: obj.id === activeSelectedObjectId ? '#ffc200' : (flaggedObjectIds.has(obj.id) ? '#ff9f1c' : '#777777'),
        stroke: obj.id === activeSelectedObjectId ? 1.5 : 0.8
      };
    }).filter(t => t.points.length > 0);
  }, [objects, activeSelectedObjectId, flaggedObjectIds, simulationDate, activeEvent, showDebris, trailMinutes]);

  // Conjunction arcs
  const arcsData = showDebris
    ? conjunctions.filter(c => c.defcon <= 4).map((conj) => ({
        startLat: conj.primary.lat,
        startLng: conj.primary.lng,
        endLat: conj.secondary.lat,
        endLng: conj.secondary.lng,
        color: conj.defcon <= 2 ? '#ff3030' : '#ff6820',
        id: conj.id,
      }))
    : [];

  const ringsData = activeSelectedObjectId && showDebris
    ? [{
        lat: objects.find(o => o.id === activeSelectedObjectId)?.lat || 0,
        lng: objects.find(o => o.id === activeSelectedObjectId)?.lng || 0,
        maxR: 6,
        propagationSpeed: 1.8,
        repeatPeriod: 1500,
        color: 'rgba(255, 194, 0, 0.65)',
      }]
    : [];

  if (!mounted || !GlobeComponent) {
    return (
      <div style={{
        ...getGlobeStyle(),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        backgroundColor: '#06050a',
      }}>
        <svg
          style={{ width: '40px', height: '40px', color: 'var(--gold)', opacity: 0.5 }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
        <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: '11px', color: 'var(--t1)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          LOADING ORBITAL TELEMETRY DATA
        </div>
        <div style={{ width: '128px', height: '1px', background: 'rgba(255, 194, 0, 0.10)', position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '64px',
              background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
              animation: 'scan 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={getGlobeStyle()}>
      <GlobeComponent
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl={null}
        atmosphereColor="#ffc200"
        atmosphereAltitude={0.06}
        width={typeof window !== 'undefined' ? window.innerWidth : 1920}
        height={typeof window !== 'undefined' ? window.innerHeight : 1080}
        onGlobeReady={handleGlobeReady}
        
        // Render 3D Spheres or Heatmap rings
        customLayerData={pointsData}
        customThreeObject={(d: any) => {
          if (d.isShell) {
            // Render 3D equatorial ring (Torus) representing danger zone orbital shells
            const radius = 100 * (1 + d.altitude);
            const geometry = new THREE.RingGeometry(radius - 0.6, radius + 0.6, 128);
            const material = new THREE.MeshBasicMaterial({
              color: d.color,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.45,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = Math.PI / 2;
            return mesh;
          }

          const geometry = new THREE.SphereGeometry(d.size, 16, 16);
          const material = new THREE.MeshBasicMaterial({ color: d.color });
          return new THREE.Mesh(geometry, material);
        }}
        customThreeObjectUpdate={(obj: any, d: any) => {
          if (globeRef.current) {
            if (d.isShell) {
              obj.position.set(0, 0, 0); // center on core
            } else {
              const coords = globeRef.current.getCoords(d.lat, d.lng, d.altitude);
              Object.assign(obj.position, coords);
              
              if (d.isFlashing) {
                const pulseColor = pulseToggler ? '#ffffff' : '#ff0000';
                obj.material.color.set(pulseColor);
                obj.scale.set(1.4, 1.4, 1.4);
              } else {
                obj.material.color.set(d.color);
                obj.scale.set(1, 1, 1);
              }
            }
          }
        }}
        customLayerLabel={(d: any) => {
          if (d.isShell) {
            return `
              <div style="
                font-family: 'Rajdhani', sans-serif;
                background: rgba(8,6,1,0.96);
                border: 0.5px solid ${d.color};
                padding: 6px 12px;
                border-radius: 2px;
                color: #fff3cc;
                font-size: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.6);
              ">
                <div style="font-weight: 700; color: ${d.color}; text-transform: uppercase;">${d.name}</div>
                <div style="font-family: 'Source Code Pro', monospace; font-size: 10px; color: #c8b070; margin-top: 3px;">
                  ${d.desc}
                </div>
              </div>
            `;
          }
          return `
            <div style="
              font-family: 'Rajdhani', sans-serif;
              background: rgba(8,6,1,0.95);
              border: 0.5px solid #2e2600;
              padding: 6px 12px;
              border-radius: 2px;
              color: #fff3cc;
              font-size: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.6);
            ">
              <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
                ${d.name} ${d.isFlashing ? '<span style="color: #ff3030; font-size: 10px; animation: flash 1s infinite">⚡ FLASH CONJUNCTION NOW</span>' : ''}
              </div>
              <div style="font-family: 'Source Code Pro', monospace; font-size: 10px; color: #c8b070; margin-top: 3px;">
                NORAD ${d.noradId} · ${d.altitudeKm.toFixed(1)} km · ${d.type}
              </div>
            </div>
          `;
        }}
        onCustomLayerClick={(obj: any) => {
          if (!obj.isShell && activeOnObjectSelect) {
            activeOnObjectSelect(obj.id);
          }
        }}

        // Orbital Trails (Last 30-minute paths)
        pathsData={trailsData}
        pathPoints={(d: any) => d.points}
        pathColor={(d: any) => d.color}
        pathStroke={(d: any) => d.stroke}
        pathDashLength={0.15}
        pathDashGap={0.08}
        pathDashAnimateTime={8000}

        // Arcs (Conjunction corridors)
        arcsData={arcsData}
        arcColor="color"
        arcStroke={0.5}
        arcDashLength={0.3}
        arcDashGap={0.1}
        arcDashAnimateTime={1600}
        onArcClick={(arc: any) => {
          router.push(`/threats?id=${arc.id}`);
        }}

        // Rings (Selected target)
        ringsData={ringsData}
        ringColor="color"
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
      />
    </div>
  );
}
