'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SpaceObject, Conjunction, ObjectType, AgentRole, DefconLevel, ViewMode } from '@/types';
import { SPACE_OBJECTS, CONJUNCTIONS } from '@/lib/mock-data';
import { HISTORICAL_EVENTS, propagateHistorical } from '@/lib/historical-data';
import { supabase } from '@/lib/supabase';
import * as satellite from 'satellite.js';

interface AegisContextType {
  objects: SpaceObject[];
  conjunctions: Conjunction[];
  stats: {
    totalTracked: number;
    payloads: number;
    debris: number;
    rocketBodies: number;
    activeConjunctions: number;
    criticalAlerts: number;
    lastUpdated: string;
  };
  loading: boolean;
  selectedObjectId: string | null;
  setSelectedObjectId: (id: string | null) => void;
  selectedConjunctionId: string | null;
  setSelectedConjunctionId: (id: string | null) => void;
  refreshData: () => Promise<void>;
  isRealData: boolean;
  hasEntered: boolean;
  setHasEntered: (val: boolean) => void;
  isTransitioning: boolean;
  setIsTransitioning: (val: boolean) => void;
  
  // Time Machine & Regime Extensions
  simulationDate: Date | null;
  setSimulationDate: (date: Date | null) => void;
  activeEvent: 'LIVE' | 'IRIDIUM_COSMOS' | 'RUSSIAN_ASAT' | 'ISS_NEARMISS';
  setActiveEvent: (event: 'LIVE' | 'IRIDIUM_COSMOS' | 'RUSSIAN_ASAT' | 'ISS_NEARMISS') => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  regime: 'ALL' | 'LEO' | 'MEO' | 'GEO';
  setRegime: (regime: 'ALL' | 'LEO' | 'MEO' | 'GEO') => void;
}

const AegisContext = createContext<AegisContextType | undefined>(undefined);

// SGP4 propagation function
function propagateTLE(tle1: string, tle2: string, date: Date) {
  try {
    const satrec = satellite.twoline2satrec(tle1, tle2);
    const positionAndVelocity = satellite.propagate(satrec, date);
    if (!positionAndVelocity || !positionAndVelocity.position) return null;
    const pos = positionAndVelocity.position as satellite.EciVec3<number>;
    if (!pos || typeof pos === 'boolean') return null;

    const gmst = satellite.gstime(date);
    const geo = satellite.eciToGeodetic(pos, gmst);
    return {
      lat: satellite.degreesLat(geo.latitude),
      lng: satellite.degreesLong(geo.longitude),
      altKm: geo.height
    };
  } catch {
    return null;
  }
}

// Historical Conjunction Mapping
const HISTORICAL_CONJUNCTIONS: Record<string, Conjunction> = {
  IRIDIUM_COSMOS: {
    id: 'hist-conj-iridium-cosmos',
    primary: {
      id: 'hist-iridium', name: 'IRIDIUM 33', noradId: 24943, type: 'PAYLOAD',
      country: 'USA', countryFull: 'United States', altitude: 789,
      inclination: 86.4, period: 100.4, launched: '1997-09-14', riskScore: 99,
      status: 'ACTIVE', lat: 72.5, lng: 97.4
    },
    secondary: {
      id: 'hist-cosmos', name: 'COSMOS 2251', noradId: 22675, type: 'PAYLOAD',
      country: 'CIS', countryFull: 'CIS (Russia)', altitude: 789,
      inclination: 74.0, period: 100.7, launched: '1993-06-16', riskScore: 99,
      status: 'INACTIVE', lat: 72.5, lng: 97.4
    },
    tca: '2009-02-10T16:56:12Z',
    missDistance: 0.0,
    collisionPc: 1.0,
    relVelocity: 11.7,
    defcon: 1,
    assessments: [
      {
        agent: 'SENTINEL', timestamp: '2009-02-10T16:00:00Z',
        text: 'ALERT: Radial convergence detected. SGP4 orbital propagation indicates Iridium 33 and Cosmos 2251 trajectories intersecting at LEO altitude 789 km. Collision risk is critical.'
      },
      {
        agent: 'ANALYST', timestamp: '2009-02-10T16:15:00Z',
        text: 'CRITICAL: Collision probability calculated at 1.0 (100% intercept). Relative velocity is 11.7 km/s. Hypervelocity impact will result in total fragmentation of both payloads, generating massive debris field.'
      },
      {
        agent: 'COMMANDER', timestamp: '2009-02-10T16:30:00Z',
        text: 'MANEUVER THREAT ASSESSMENT: Cosmos 2251 is defunct and non-maneuverable. Iridium 33 is operational but does not have automated collision avoidance and command upload window has closed. Direct intercept is unavoidable.'
      },
      {
        agent: 'HERALD', timestamp: '2009-02-10T16:45:00Z',
        text: 'IMMEDIATE WARNING issued to spacecraft operators globally. Catastrophic fragmentation event expected at 16:56:12 UTC. High-risk zones projected in LEO 700-900km altitude shells.'
      }
    ]
  },
  RUSSIAN_ASAT: {
    id: 'hist-conj-russian-asat',
    primary: {
      id: 'hist-cosmos1408', name: 'COSMOS 1408', noradId: 13589, type: 'PAYLOAD',
      country: 'CIS', countryFull: 'CIS (Russia)', altitude: 480,
      inclination: 82.6, period: 94.2, launched: '1982-09-16', riskScore: 99,
      status: 'INACTIVE', lat: 55.0, lng: 37.0
    },
    secondary: {
      id: 'hist-missile', name: 'PL-19 ASAT MISSILE', noradId: 99999, type: 'ROCKET_BODY',
      country: 'RUS', countryFull: 'CIS (Russia)', altitude: 480,
      inclination: 62.0, period: 0, launched: '2021-11-15', riskScore: 99,
      status: 'ACTIVE', lat: 55.0, lng: 37.0
    },
    tca: '2021-11-15T02:45:00Z',
    missDistance: 0.0,
    collisionPc: 1.0,
    relVelocity: 7.8,
    defcon: 1,
    assessments: [
      {
        agent: 'SENTINEL', timestamp: '2021-11-15T02:30:00Z',
        text: 'WARNING: Rapid vertical ascent trajectory detected from Plesetsk Cosmodrome. Vector intersects Cosmos 1408 orbit plane.'
      },
      {
        agent: 'ANALYST', timestamp: '2021-11-15T02:35:00Z',
        text: 'EVALUATION: Kinetic anti-satellite (ASAT) interceptor profile confirmed. Collision probability: 100%. Targeted altitude: 480 km. Combined kinetic energy will result in catastrophic fragmentation.'
      },
      {
        agent: 'COMMANDER', timestamp: '2021-11-15T02:40:00Z',
        text: 'TACTICAL IMPACT ADVISORY: Cosmos 1408 is a defunct 2-ton spy satellite. Debris dispersion cloud will immediately threaten the International Space Station and low-altitude LEO constellations. ISS crew ordered to take shelter.'
      },
      {
        agent: 'HERALD', timestamp: '2021-11-15T02:44:00Z',
        text: 'EMERGENCY ALERT: ASAT kinetic impact imminent. All orbital tracking assets directed to prioritize acquisition of the post-impact debris field.'
      }
    ]
  },
  ISS_NEARMISS: {
    id: 'hist-conj-iss-nearmiss',
    primary: {
      id: 'hist-iss', name: 'ISS (ZARYA)', noradId: 25544, type: 'PAYLOAD',
      country: 'USA/RUS/ESA', countryFull: 'Multi-National', altitude: 415,
      inclination: 51.6, period: 92.8, launched: '1998-11-20', riskScore: 10,
      status: 'ACTIVE', lat: -10.0, lng: -45.0
    },
    secondary: {
      id: 'hist-breeze', name: 'BREEZE-M FRAGMENT', noradId: 39999, type: 'DEBRIS',
      country: 'RUS', countryFull: 'CIS (Russia)', altitude: 415,
      inclination: 74.0, period: 95.0, launched: '2012-08-06', riskScore: 80,
      status: 'INACTIVE', lat: -10.0, lng: -45.0
    },
    tca: '2015-06-16T12:00:00Z',
    missDistance: 0.15,
    collisionPc: 4.8e-3,
    relVelocity: 14.1,
    defcon: 2,
    assessments: [
      {
        agent: 'SENTINEL', timestamp: '2015-06-16T11:00:00Z',
        text: 'URGENT: High-velocity debris track converging on ISS orbital corridor. Minimum miss distance projected at 150 meters. Relative speed: 14.1 km/s.'
      },
      {
        agent: 'ANALYST', timestamp: '2015-06-16T11:15:00Z',
        text: 'CRITICAL RISK: Collision probability stands at 4.8×10⁻³. Debris diameter estimated at 15cm, sufficient to puncture pressurized modules. Collision probability exceeds red-line threshold.'
      },
      {
        agent: 'COMMANDER', timestamp: '2015-06-16T11:30:00Z',
        text: 'COMMAND DECISION: Conjunction detected too late for standard debris avoidance burn (PDAM). Flight directors ordered ISS crew (Expedition 44) to shelter in the Soyuz spacecraft at 11:55 UTC.'
      },
      {
        agent: 'HERALD', timestamp: '2015-06-16T11:45:00Z',
        text: 'BULLETIN: Crew secure inside Soyuz lifeboat. Proximity watch initiated. Closest approach expected at 12:00:00 UTC.'
      }
    ]
  }
};

export function AegisProvider({ children }: { children: React.ReactNode }) {
  const [dbObjects, setDbObjects] = useState<SpaceObject[]>([]);
  const [dbConjunctions, setDbConjunctions] = useState<Conjunction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRealData, setIsRealData] = useState<boolean>(false);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedConjunctionId, setSelectedConjunctionId] = useState<string | null>(null);
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Time Machine states
  const [simulationDate, setSimulationDate] = useState<Date | null>(null);
  const [activeEvent, setActiveEvent] = useState<'LIVE' | 'IRIDIUM_COSMOS' | 'RUSSIAN_ASAT' | 'ISS_NEARMISS'>('LIVE');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(60); // default 60x (1 minute per real second)
  const [regime, setRegime] = useState<'ALL' | 'LEO' | 'MEO' | 'GEO'>('ALL');

  const [propagatedDate, setPropagatedDate] = useState<Date>(() => new Date());
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!simulationDate) {
      setPropagatedDate(new Date());
      return;
    }

    const now = performance.now();
    if (isPlaying) {
      if (now - lastUpdateRef.current >= 1000) {
        setPropagatedDate(simulationDate);
        lastUpdateRef.current = now;
      }
    } else {
      setPropagatedDate(simulationDate);
      lastUpdateRef.current = now;
    }
  }, [simulationDate, isPlaying]);

  const [stats, setStats] = useState({
    totalTracked: 0,
    payloads: 0,
    debris: 0,
    rocketBodies: 0,
    activeConjunctions: 0,
    criticalAlerts: 0,
    lastUpdated: new Date().toISOString()
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const objectsRes = await fetch('/api/objects?limit=600');
      if (!objectsRes.ok) throw new Error('Failed to load objects');
      const objectsData = await objectsRes.json();

      const conjunctionsRes = await fetch('/api/conjunctions?status=ALL&limit=100');
      if (!conjunctionsRes.ok) throw new Error('Failed to load conjunctions');
      const conjunctionsData = await conjunctionsRes.json();

      const statsRes = await fetch('/api/stats');
      if (!statsRes.ok) throw new Error('Failed to load stats');
      const statsData = await statsRes.json();

      if (objectsData.data && objectsData.data.length > 0) {
        setIsRealData(true);

        const mappedObjects: SpaceObject[] = objectsData.data.map((db: any) => {
          let lat = 0;
          let lng = 0;
          if (db.tle_line1 && db.tle_line2) {
            const pos = propagateTLE(db.tle_line1, db.tle_line2, new Date());
            if (pos) {
              lat = pos.lat;
              lng = pos.lng;
            }
          }

          return {
            id: db.id,
            name: db.name,
            noradId: parseInt(db.norad_id),
            type: db.object_type as ObjectType,
            country: db.country || 'UNKNOWN',
            countryFull: db.country || 'Unknown',
            altitude: db.altitude_km || 0,
            inclination: db.inclination_deg || 0,
            period: db.period_min || 0,
            launched: db.launch_date || 'UNKNOWN',
            riskScore: db.risk_score || 0,
            status: db.is_active ? 'ACTIVE' : 'INACTIVE',
            lat,
            lng,
            tle1: db.tle_line1,
            tle2: db.tle_line2
          };
        });

        const objectsMap = new Map<string, SpaceObject>();
        mappedObjects.forEach(obj => objectsMap.set(String(obj.noradId), obj));

        const mappedConjunctions: Conjunction[] = conjunctionsData.data.map((db: any) => {
          const objA = db.object_a || (db.object_a_norad ? objectsMap.get(db.object_a_norad) : null);
          const objB = db.object_b || (db.object_b_norad ? objectsMap.get(db.object_b_norad) : null);

          const primary: SpaceObject = objA ? {
            id: objA.id,
            name: objA.name,
            noradId: parseInt(objA.norad_id),
            type: objA.object_type as ObjectType,
            country: objA.country,
            countryFull: objA.country,
            altitude: objA.altitude_km || 0,
            inclination: objA.inclination_deg || 0,
            period: objA.period_min || 0,
            launched: objA.launch_date || 'Unknown',
            riskScore: objA.risk_score || 0,
            status: objA.is_active ? 'ACTIVE' : 'INACTIVE',
            lat: 0,
            lng: 0
          } : {
            id: db.object_a_norad,
            name: `NORAD ${db.object_a_norad}`,
            noradId: parseInt(db.object_a_norad),
            type: 'UNKNOWN' as any,
            country: 'Unknown',
            countryFull: 'Unknown',
            altitude: 0,
            inclination: 0,
            period: 0,
            launched: 'Unknown',
            riskScore: 0,
            status: 'INACTIVE',
            lat: 0,
            lng: 0
          };

          const secondary: SpaceObject = objB ? {
            id: objB.id,
            name: objB.name,
            noradId: parseInt(objB.norad_id),
            type: objB.object_type as ObjectType,
            country: objB.country,
            countryFull: objB.country,
            altitude: objB.altitude_km || 0,
            inclination: objB.inclination_deg || 0,
            period: objB.period_min || 0,
            launched: objB.launch_date || 'Unknown',
            riskScore: objB.risk_score || 0,
            status: objB.is_active ? 'ACTIVE' : 'INACTIVE',
            lat: 0,
            lng: 0
          } : {
            id: db.object_b_norad,
            name: `NORAD ${db.object_b_norad}`,
            noradId: parseInt(db.object_b_norad),
            type: 'UNKNOWN' as any,
            country: 'Unknown',
            countryFull: 'Unknown',
            altitude: 0,
            inclination: 0,
            period: 0,
            launched: 'Unknown',
            riskScore: 0,
            status: 'INACTIVE',
            lat: 0,
            lng: 0
          };

          const assessments = (db.agent_logs || []).map((log: any) => ({
            agent: log.agent_name as AgentRole,
            timestamp: log.created_at,
            text: log.reasoning
          }));

          const commanderLog = (db.agent_logs || []).find((l: any) => l.agent_name === 'COMMANDER');
          const cmdOut = commanderLog?.output;

          return {
            id: db.id,
            primary,
            secondary,
            tca: db.time_of_closest_approach,
            missDistance: db.miss_distance_km,
            collisionPc: db.collision_probability,
            relVelocity: db.relative_velocity_kms,
            defcon: db.defcon_level as DefconLevel,
            assessments,
            recommendation: cmdOut ? {
              action: cmdOut.goNoGo === 'GO' ? `MANEUVER (${cmdOut.maneuverType})` : 'MONITOR',
              deltaV: cmdOut.deltaVms,
              fuelCost: cmdOut.fuelCostKg,
              windowCountdown: cmdOut.burnWindowMinsBefore ? `${cmdOut.burnWindowMinsBefore} mins` : 'N/A'
            } : undefined
          };
        });

        setDbObjects(mappedObjects);
        setDbConjunctions(mappedConjunctions);
        setStats(statsData);
      } else {
        setDbObjects(SPACE_OBJECTS);
        setDbConjunctions(CONJUNCTIONS);
        setStats({
          totalTracked: SPACE_OBJECTS.length,
          payloads: SPACE_OBJECTS.filter(o => o.type === 'PAYLOAD').length,
          debris: SPACE_OBJECTS.filter(o => o.type === 'DEBRIS').length,
          rocketBodies: SPACE_OBJECTS.filter(o => o.type === 'ROCKET_BODY').length,
          activeConjunctions: CONJUNCTIONS.filter(c => c.defcon <= 4).length,
          criticalAlerts: CONJUNCTIONS.filter(c => c.defcon <= 2).length,
          lastUpdated: new Date().toISOString()
        });
        setIsRealData(false);
      }
    } catch (err) {
      console.warn('API connection failed. Falling back to mock data.', err);
      setDbObjects(SPACE_OBJECTS);
      setDbConjunctions(CONJUNCTIONS);
      setStats({
        totalTracked: SPACE_OBJECTS.length,
        payloads: SPACE_OBJECTS.filter(o => o.type === 'PAYLOAD').length,
        debris: SPACE_OBJECTS.filter(o => o.type === 'DEBRIS').length,
        rocketBodies: SPACE_OBJECTS.filter(o => o.type === 'ROCKET_BODY').length,
        activeConjunctions: CONJUNCTIONS.filter(c => c.defcon <= 4).length,
        criticalAlerts: CONJUNCTIONS.filter(c => c.defcon <= 2).length,
        lastUpdated: new Date().toISOString()
      });
      setIsRealData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time Supabase Realtime Listener and Push Notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    const channel = supabase
      .channel('live-conjunctions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conjunctions' },
        (payload) => {
          console.log('Realtime conjunction event received:', payload);
          fetchData(); // Trigger full status/objects refresh

          if (payload.eventType === 'INSERT') {
            const newConj = payload.new;
            if (newConj.defcon_level <= 2 && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('🚨 AEGIS CRITICAL CONJUNCTION DETECTED', {
                body: `DEFCON ${newConj.defcon_level} alert! Miss distance: ${newConj.miss_distance_km} km. Safe maneuvers evaluated.`,
                icon: '/favicon.ico'
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Real-time propagation fallback when NOT in simulator/playing mode
  useEffect(() => {
    if (dbObjects.length === 0 || simulationDate !== null || isPlaying) return;

    const interval = setInterval(() => {
      setDbObjects(prevObjects =>
        prevObjects.map(obj => {
          if (obj.tle1 && obj.tle2) {
            const pos = propagateTLE(obj.tle1, obj.tle2, new Date());
            if (pos) {
              return {
                ...obj,
                lat: pos.lat,
                lng: pos.lng
              };
            }
          }
          return obj;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [dbObjects.length, simulationDate, isPlaying]);

  // Simulation play loop
  useEffect(() => {
    if (!isPlaying) return;

    let lastTime = performance.now();
    const interval = setInterval(() => {
      const nowTime = performance.now();
      const deltaMs = nowTime - lastTime;
      lastTime = nowTime;

      setSimulationDate((prev) => {
        const base = prev || new Date();
        return new Date(base.getTime() + deltaMs * simulationSpeed);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, simulationSpeed]);

  // Compute final orbital positions based on time and event
  const simulatedObjects = useMemo(() => {
    if (activeEvent !== 'LIVE') {
      const event = HISTORICAL_EVENTS.find(e => e.id === activeEvent);
      const targetDate = propagatedDate || (event ? event.tca : new Date());
      
      return propagateHistorical(activeEvent, targetDate).map(obj => ({
        id: obj.id,
        name: obj.name,
        noradId: obj.noradId,
        type: obj.type,
        country: obj.country,
        countryFull: obj.country,
        altitude: obj.altitude,
        inclination: obj.noradId === 25544 ? 51.6 : (obj.noradId === 24943 ? 86.4 : 74.0),
        period: 92.8,
        launched: 'HISTORICAL',
        riskScore: obj.type === 'DEBRIS' ? 88 : 15,
        status: 'ACTIVE' as const,
        lat: obj.lat,
        lng: obj.lng
      }));
    }

    const targetDate = propagatedDate || new Date();
    return dbObjects.map(obj => {
      if (obj.tle1 && obj.tle2) {
        const pos = propagateTLE(obj.tle1, obj.tle2, targetDate);
        if (pos) {
          return {
            ...obj,
            lat: pos.lat,
            lng: pos.lng
          };
        }
      }
      return obj;
    });
  }, [dbObjects, activeEvent, propagatedDate]);

  // Filter objects by selected regime/shell
  const filteredObjects = useMemo(() => {
    return simulatedObjects.filter(obj => {
      if (regime === 'ALL') return true;
      if (regime === 'LEO') return obj.altitude < 2000;
      if (regime === 'MEO') return obj.altitude >= 2000 && obj.altitude < 35000;
      if (regime === 'GEO') return obj.altitude >= 35000;
      return true;
    });
  }, [simulatedObjects, regime]);

  // Override conjunctions for historical events
  const displayedConjunctions = useMemo(() => {
    if (activeEvent !== 'LIVE') {
      const conj = HISTORICAL_CONJUNCTIONS[activeEvent];
      return conj ? [conj] : [];
    }
    return dbConjunctions;
  }, [dbConjunctions, activeEvent]);

  // Propagate conjunction parameters dynamically (Escalation & Resolution)
  const simulatedConjunctions = useMemo(() => {
    const targetDate = simulationDate || new Date();
    const targetTime = targetDate.getTime();

    return displayedConjunctions.map(conj => {
      let latA = conj.primary.lat;
      let lngA = conj.primary.lng;
      let latB = conj.secondary.lat;
      let lngB = conj.secondary.lng;

      if (conj.primary.tle1 && conj.primary.tle2) {
        const pos = propagateTLE(conj.primary.tle1, conj.primary.tle2, targetDate);
        if (pos) { latA = pos.lat; lngA = pos.lng; }
      }
      if (conj.secondary.tle1 && conj.secondary.tle2) {
        const pos = propagateTLE(conj.secondary.tle1, conj.secondary.tle2, targetDate);
        if (pos) { latB = pos.lat; lngB = pos.lng; }
      }

      const tcaTime = new Date(conj.tca).getTime();
      const elapsedSec = (targetTime - tcaTime) / 1000;

      let missDistance = conj.missDistance;
      let collisionPc = conj.collisionPc;
      let defcon = conj.defcon;
      let isResolved = false;

      if (elapsedSec > 300) {
        // Safe separation after TCA -> auto-resolve
        isResolved = true;
        missDistance = conj.missDistance * (1 + elapsedSec / 120);
        collisionPc = 0;
        defcon = 5;
      } else if (elapsedSec < -7200) {
        // Pre-approach corridor
        defcon = 4;
        missDistance = conj.missDistance * 1.6;
        collisionPc = conj.collisionPc * 0.08;
      } else {
        // Conjunction approach: miss distance shrinks, Pc escalates, DEFCON rises
        const approachRatio = Math.max(0.01, Math.abs(elapsedSec) / 7200);
        missDistance = conj.missDistance * (approachRatio + 0.1);
        collisionPc = Math.min(1.0, conj.collisionPc * (1.0 / (approachRatio + 0.04)));

        if (missDistance < 1.2) defcon = 1;
        else if (missDistance < 2.5) defcon = 2;
        else if (missDistance < 4.0) defcon = 3;
        else defcon = 4;
      }

      return {
        ...conj,
        primary: { ...conj.primary, lat: latA, lng: lngA },
        secondary: { ...conj.secondary, lat: latB, lng: lngB },
        missDistance: Number(missDistance.toFixed(2)),
        collisionPc,
        defcon,
        status: isResolved ? 'RESOLVED' : (defcon <= 2 ? 'ACTIVE' : 'MONITORING')
      } as Conjunction;
    });
  }, [displayedConjunctions, simulationDate]);

  return (
    <AegisContext.Provider
      value={{
        objects: filteredObjects,
        conjunctions: simulatedConjunctions,
        stats: {
          ...stats,
          totalTracked: activeEvent === 'LIVE' ? stats.totalTracked : filteredObjects.length,
          activeConjunctions: simulatedConjunctions.filter(c => c.status !== 'RESOLVED').length,
          criticalAlerts: simulatedConjunctions.filter(c => c.defcon <= 2 && c.status !== 'RESOLVED').length
        },
        loading,
        selectedObjectId,
        setSelectedObjectId,
        selectedConjunctionId,
        setSelectedConjunctionId,
        refreshData: fetchData,
        isRealData,
        hasEntered,
        setHasEntered,
        isTransitioning,
        setIsTransitioning,
        
        // Time Machine & Regime Extensions
        simulationDate,
        setSimulationDate,
        activeEvent,
        setActiveEvent,
        isPlaying,
        setIsPlaying,
        simulationSpeed,
        setSimulationSpeed,
        regime,
        setRegime
      }}
    >
      {children}
    </AegisContext.Provider>
  );
}

export function useAegis() {
  const context = useContext(AegisContext);
  if (context === undefined) {
    throw new Error('useAegis must be used within an AegisProvider');
  }
  return context;
}
