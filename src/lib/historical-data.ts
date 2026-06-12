import * as satellite from 'satellite.js';

// Earth Gravitational Parameter
const MU = 3.986004418e5; // km^3/s^2
const EARTH_RADIUS_KM = 6371;

export interface HistoricalObject {
  id: string;
  name: string;
  noradId: number;
  type: 'PAYLOAD' | 'DEBRIS' | 'ROCKET_BODY';
  country: string;
  altitude: number;
  lat: number;
  lng: number;
  isDebris?: boolean;
}

export interface HistoricalEvent {
  id: string;
  name: string;
  dateStr: string;
  tca: Date;
  description: string;
  locationInfo: string;
  minDistanceM: number;
  velocityKms: number;
  objects: string[];
}

export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  {
    id: 'IRIDIUM_COSMOS',
    name: '2009 Iridium-Cosmos Collision',
    dateStr: 'Feb 10, 2009 16:56 UTC',
    tca: new Date('2009-02-10T16:56:12Z'),
    description: 'The first hypervelocity collision between two intact spacecraft in Earth orbit. Iridium 33 (operational communications satellite) and Cosmos 2251 (inactive Russian military satellite) collided at 11.7 km/s, producing over 2,000 trackable debris fragments that continue to threaten LEO space assets.',
    locationInfo: 'Over Taymyr Peninsula, Siberia (altitude 789 km)',
    minDistanceM: 0,
    velocityKms: 11.7,
    objects: ['IRIDIUM 33', 'COSMOS 2251'],
  },
  {
    id: 'RUSSIAN_ASAT',
    name: '2021 Russian ASAT Test',
    dateStr: 'Nov 15, 2021 02:45 UTC',
    tca: new Date('2021-11-15T02:45:00Z'),
    description: 'A direct-ascent anti-satellite (DA-ASAT) missile launched from Plesetsk Cosmodrome intercepted the defunct Soviet spy satellite Cosmos 1408 at 480 km altitude. The kinetic impact shattered the satellite into a cloud of over 1,500 trackable fragments, forcing the ISS crew to perform emergency shelter procedures.',
    locationInfo: 'Low Earth Orbit (altitude 480 km)',
    minDistanceM: 0,
    velocityKms: 7.8,
    objects: ['COSMOS 1408', 'PL-19 ASAT Missile'],
  },
  {
    id: 'ISS_NEARMISS',
    name: 'Near-Miss ISS Debris Alert',
    dateStr: 'Jun 16, 2015 12:00 UTC',
    tca: new Date('2015-06-16T12:00:00Z'),
    description: 'A critical conjunction event where a fragment of a Russian Breeze-M upper stage passed within 150 meters of the International Space Station. Due to late tracking notice, the ISS could not perform a Debris Avoidance Maneuver (PDAM). The crew retreated to the docked Soyuz capsule for safety during the close approach.',
    locationInfo: 'ISS Orbit Corridor (altitude 415 km)',
    minDistanceM: 150,
    velocityKms: 14.1,
    objects: ['ISS (ZARYA)', 'BREEZE-M FRAGMENT'],
  },
];

// Helper to convert ECI cartesian to Lat/Lng
export function eciToGeo(x: number, y: number, z: number, date: Date) {
  try {
    const gmst = satellite.gstime(date);
    const geo = satellite.eciToGeodetic({ x, y, z }, gmst);
    return {
      lat: satellite.degreesLat(geo.latitude),
      lng: satellite.degreesLong(geo.longitude),
      alt: geo.height
    };
  } catch {
    // Math fallback
    const r = Math.sqrt(x*x + y*y + z*z);
    const lat = Math.asin(z / r) * 180 / Math.PI;
    const elapsedHrs = (date.getTime() / 1000 * 0.004178) % 360;
    let lng = (Math.atan2(y, x) * 180 / Math.PI - elapsedHrs) % 360;
    if (lng < -180) lng += 360;
    if (lng > 180) lng -= 360;
    return { lat, lng, alt: r - EARTH_RADIUS_KM };
  }
}

// 3D vector math helpers
interface Vector3D {
  x: number;
  y: number;
  z: number;
}

function normalize(v: Vector3D): Vector3D {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function cross(a: Vector3D, b: Vector3D): Vector3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

// Generate orbits mathematically for the 2009 Collision
// Collision point: lat 72.5, lng 97.4, alt 789 km
const R_IRIDIUM = EARTH_RADIUS_KM + 789;
// Let's create ECI coordinates for the collision point at tca
const lat_c = 72.5 * Math.PI / 180;
const lng_c = 97.4 * Math.PI / 180;
const p_collision_eci: Vector3D = {
  x: R_IRIDIUM * Math.cos(lat_c) * Math.cos(lng_c),
  y: R_IRIDIUM * Math.cos(lat_c) * Math.sin(lng_c),
  z: R_IRIDIUM * Math.sin(lat_c)
};

// Orbit plane basis vectors
const u_coll = normalize(p_collision_eci);
// Iridium 33 is near-polar (inclination 86.4)
const v_iridium = normalize({ x: -u_coll.z, y: 0.1, z: u_coll.x }); // northern velocity
const normal_iridium = cross(u_coll, v_iridium);
const v_iridium_ortho = cross(normal_iridium, u_coll);

// Cosmos 2251 has inclination 74.0
const v_cosmos = normalize({ x: 0.2, y: -u_coll.z, z: u_coll.y });
const normal_cosmos = cross(u_coll, v_cosmos);
const v_cosmos_ortho = cross(normal_cosmos, u_coll);

// Precompute 50 debris particles' orbits
const IRIDIUM_DEBRIS_ORBITS = Array.from({ length: 30 }, (_, i) => {
  // Perturb the plane
  const theta = (i / 30) * Math.PI * 2;
  const mix = 0.3 + Math.random() * 0.4; // blend velocities
  const dir: Vector3D = {
    x: v_iridium_ortho.x * mix + v_cosmos_ortho.x * (1 - mix) + (Math.random() - 0.5) * 0.15,
    y: v_iridium_ortho.y * mix + v_cosmos_ortho.y * (1 - mix) + (Math.random() - 0.5) * 0.15,
    z: v_iridium_ortho.z * mix + v_cosmos_ortho.z * (1 - mix) + (Math.random() - 0.5) * 0.15,
  };
  const v_dir = normalize(cross(cross(u_coll, dir), u_coll));
  const altPerturb = (Math.random() - 0.5) * 60; // km
  const r = R_IRIDIUM + altPerturb;
  const omega = Math.sqrt(MU / Math.pow(r, 3));
  return { r, omega, u: u_coll, v: v_dir };
});

const COSMOS_DEBRIS_ORBITS = Array.from({ length: 30 }, (_, i) => {
  const mix = 0.1 + Math.random() * 0.3; // more cosmos velocity
  const dir: Vector3D = {
    x: v_cosmos_ortho.x * mix + v_iridium_ortho.x * (1 - mix) + (Math.random() - 0.5) * 0.15,
    y: v_cosmos_ortho.y * mix + v_iridium_ortho.y * (1 - mix) + (Math.random() - 0.5) * 0.15,
    z: v_cosmos_ortho.z * mix + v_iridium_ortho.z * (1 - mix) + (Math.random() - 0.5) * 0.15,
  };
  const v_dir = normalize(cross(cross(u_coll, dir), u_coll));
  const altPerturb = (Math.random() - 0.5) * 80;
  const r = R_IRIDIUM + altPerturb;
  const omega = Math.sqrt(MU / Math.pow(r, 3));
  return { r, omega, u: u_coll, v: v_dir };
});

// 2021 Russian ASAT event: Cosmos 1408
const R_ASAT = EARTH_RADIUS_KM + 480;
const lat_asat = 55.0 * Math.PI / 180;
const lng_asat = 37.0 * Math.PI / 180;
const p_asat_collision_eci: Vector3D = {
  x: R_ASAT * Math.cos(lat_asat) * Math.cos(lng_asat),
  y: R_ASAT * Math.cos(lat_asat) * Math.sin(lng_asat),
  z: R_ASAT * Math.sin(lat_asat)
};
const u_asat = normalize(p_asat_collision_eci);
const v_asat = normalize({ x: -u_asat.y, y: u_asat.x, z: 0.1 });
const normal_asat = cross(u_asat, v_asat);
const v_asat_ortho = cross(normal_asat, u_asat);

const ASAT_DEBRIS_ORBITS = Array.from({ length: 50 }, (_, i) => {
  const dir: Vector3D = {
    x: v_asat_ortho.x + (Math.random() - 0.5) * 0.25,
    y: v_asat_ortho.y + (Math.random() - 0.5) * 0.25,
    z: v_asat_ortho.z + (Math.random() - 0.5) * 0.25,
  };
  const v_dir = normalize(cross(cross(u_asat, dir), u_asat));
  const altPerturb = (Math.random() - 0.5) * 50;
  const r = R_ASAT + altPerturb;
  const omega = Math.sqrt(MU / Math.pow(r, 3));
  return { r, omega, u: u_asat, v: v_dir };
});

// ISS Near-Miss
const R_ISS = EARTH_RADIUS_KM + 415;
const lat_iss = -10.0 * Math.PI / 180;
const lng_iss = -45.0 * Math.PI / 180;
const p_iss_tca: Vector3D = {
  x: R_ISS * Math.cos(lat_iss) * Math.cos(lng_iss),
  y: R_ISS * Math.cos(lat_iss) * Math.sin(lng_iss),
  z: R_ISS * Math.sin(lat_iss)
};
const u_iss = normalize(p_iss_tca);
// ISS is inclination 51.6
const v_iss_vel = normalize({ x: -u_iss.y, y: u_iss.x, z: 0.7 });
const normal_iss = cross(u_iss, v_iss_vel);
const v_iss_ortho = cross(normal_iss, u_iss);

// Breeze-M fragment comes at high relative angle
const v_debris_vel = normalize({ x: 0.5, y: -u_iss.z, z: u_iss.y });
const normal_debris = cross(u_iss, v_debris_vel);
const v_debris_ortho = cross(normal_debris, u_iss);

export function propagateHistorical(eventId: string, date: Date): HistoricalObject[] {
  const event = HISTORICAL_EVENTS.find(e => e.id === eventId);
  if (!event) return [];

  const tcaTime = event.tca.getTime();
  const currTime = date.getTime();
  const deltaT = (currTime - tcaTime) / 1000; // seconds

  const list: HistoricalObject[] = [];

  if (eventId === 'IRIDIUM_COSMOS') {
    const period_iridium = 2 * Math.PI * Math.sqrt(Math.pow(R_IRIDIUM, 3) / MU);
    const omega_iridium = 2 * Math.PI / period_iridium;

    const hasCollided = deltaT >= 0;

    if (!hasCollided) {
      // 1. Iridium 33
      const angle1 = omega_iridium * deltaT;
      const x1 = R_IRIDIUM * (Math.cos(angle1) * u_coll.x + Math.sin(angle1) * v_iridium_ortho.x);
      const y1 = R_IRIDIUM * (Math.cos(angle1) * u_coll.y + Math.sin(angle1) * v_iridium_ortho.y);
      const z1 = R_IRIDIUM * (Math.cos(angle1) * u_coll.z + Math.sin(angle1) * v_iridium_ortho.z);
      const geo1 = eciToGeo(x1, y1, z1, date);
      list.push({
        id: 'hist-iridium',
        name: 'IRIDIUM 33',
        noradId: 24943,
        type: 'PAYLOAD',
        country: 'USA',
        altitude: geo1.alt,
        lat: geo1.lat,
        lng: geo1.lng
      });

      // 2. Cosmos 2251
      const angle2 = omega_iridium * deltaT;
      const x2 = R_IRIDIUM * (Math.cos(angle2) * u_coll.x + Math.sin(angle2) * v_cosmos_ortho.x);
      const y2 = R_IRIDIUM * (Math.cos(angle2) * u_coll.y + Math.sin(angle2) * v_cosmos_ortho.y);
      const z2 = R_IRIDIUM * (Math.cos(angle2) * u_coll.z + Math.sin(angle2) * v_cosmos_ortho.z);
      const geo2 = eciToGeo(x2, y2, z2, date);
      list.push({
        id: 'hist-cosmos',
        name: 'COSMOS 2251',
        noradId: 22675,
        type: 'PAYLOAD',
        country: 'RUS',
        altitude: geo2.alt,
        lat: geo2.lat,
        lng: geo2.lng
      });
    } else {
      // Spawn Debris cloud
      IRIDIUM_DEBRIS_ORBITS.forEach((orb, i) => {
        const angle = orb.omega * deltaT;
        const x = orb.r * (Math.cos(angle) * orb.u.x + Math.sin(angle) * orb.v.x);
        const y = orb.r * (Math.cos(angle) * orb.u.y + Math.sin(angle) * orb.v.y);
        const z = orb.r * (Math.cos(angle) * orb.u.z + Math.sin(angle) * orb.v.z);
        const geo = eciToGeo(x, y, z, date);
        list.push({
          id: `debris-iridium-${i}`,
          name: `IRIDIUM 33 DEB #${i+1}`,
          noradId: 30000 + i,
          type: 'DEBRIS',
          country: 'USA',
          altitude: geo.alt,
          lat: geo.lat,
          lng: geo.lng,
          isDebris: true
        });
      });

      COSMOS_DEBRIS_ORBITS.forEach((orb, i) => {
        const angle = orb.omega * deltaT;
        const x = orb.r * (Math.cos(angle) * orb.u.x + Math.sin(angle) * orb.v.x);
        const y = orb.r * (Math.cos(angle) * orb.u.y + Math.sin(angle) * orb.v.y);
        const z = orb.r * (Math.cos(angle) * orb.u.z + Math.sin(angle) * orb.v.z);
        const geo = eciToGeo(x, y, z, date);
        list.push({
          id: `debris-cosmos-${i}`,
          name: `COSMOS 2251 DEB #${i+1}`,
          noradId: 31000 + i,
          type: 'DEBRIS',
          country: 'RUS',
          altitude: geo.alt,
          lat: geo.lat,
          lng: geo.lng,
          isDebris: true
        });
      });
    }
  } else if (eventId === 'RUSSIAN_ASAT') {
    const period_asat = 2 * Math.PI * Math.sqrt(Math.pow(R_ASAT, 3) / MU);
    const omega_asat = 2 * Math.PI / period_asat;

    const hasCollided = deltaT >= 0;

    if (!hasCollided) {
      // 1. Cosmos 1408
      const angle = omega_asat * deltaT;
      const x = R_ASAT * (Math.cos(angle) * u_asat.x + Math.sin(angle) * v_asat_ortho.x);
      const y = R_ASAT * (Math.cos(angle) * u_asat.y + Math.sin(angle) * v_asat_ortho.y);
      const z = R_ASAT * (Math.cos(angle) * u_asat.z + Math.sin(angle) * v_asat_ortho.z);
      const geo = eciToGeo(x, y, z, date);
      list.push({
        id: 'hist-cosmos1408',
        name: 'COSMOS 1408',
        noradId: 13589,
        type: 'PAYLOAD',
        country: 'RUS',
        altitude: geo.alt,
        lat: geo.lat,
        lng: geo.lng
      });

      // 2. PL-19 ASAT Missile
      // Let's model a missile launching from Plesetsk (lat 62.9, lng 40.5)
      // Missile reaches intercept point at deltaT = 0
      const progress = 1 + deltaT / 400; // launches 400s before intercept
      if (progress >= 0) {
        const R_start = EARTH_RADIUS_KM;
        const lat_s = 62.9 * Math.PI / 180;
        const lng_s = 40.5 * Math.PI / 180;
        const p_start: Vector3D = {
          x: R_start * Math.cos(lat_s) * Math.cos(lng_s),
          y: R_start * Math.cos(lat_s) * Math.sin(lng_s),
          z: R_start * Math.sin(lat_s)
        };
        const x_m = p_start.x + (p_asat_collision_eci.x - p_start.x) * progress;
        const y_m = p_start.y + (p_asat_collision_eci.y - p_start.y) * progress;
        const z_m = p_start.z + (p_asat_collision_eci.z - p_start.z) * progress;
        const geo_m = eciToGeo(x_m, y_m, z_m, date);
        list.push({
          id: 'hist-missile',
          name: 'PL-19 ASAT MISSILE',
          noradId: 99999,
          type: 'ROCKET_BODY',
          country: 'RUS',
          altitude: geo_m.alt,
          lat: geo_m.lat,
          lng: geo_m.lng
        });
      }
    } else {
      // Spawn ASAT Debris Cloud
      ASAT_DEBRIS_ORBITS.forEach((orb, i) => {
        const angle = orb.omega * deltaT;
        const x = orb.r * (Math.cos(angle) * orb.u.x + Math.sin(angle) * orb.v.x);
        const y = orb.r * (Math.cos(angle) * orb.u.y + Math.sin(angle) * orb.v.y);
        const z = orb.r * (Math.cos(angle) * orb.u.z + Math.sin(angle) * orb.v.z);
        const geo = eciToGeo(x, y, z, date);
        list.push({
          id: `debris-asat-${i}`,
          name: `COSMOS 1408 DEB #${i+1}`,
          noradId: 32000 + i,
          type: 'DEBRIS',
          country: 'RUS',
          altitude: geo.alt,
          lat: geo.lat,
          lng: geo.lng,
          isDebris: true
        });
      });
    }
  } else if (eventId === 'ISS_NEARMISS') {
    const period_iss = 2 * Math.PI * Math.sqrt(Math.pow(R_ISS, 3) / MU);
    const omega_iss = 2 * Math.PI / period_iss;

    // 1. ISS (ZARYA)
    const angle1 = omega_iss * deltaT;
    const x1 = R_ISS * (Math.cos(angle1) * u_iss.x + Math.sin(angle1) * v_iss_ortho.x);
    const y1 = R_ISS * (Math.cos(angle1) * u_iss.y + Math.sin(angle1) * v_iss_ortho.y);
    const z1 = R_ISS * (Math.cos(angle1) * u_iss.z + Math.sin(angle1) * v_iss_ortho.z);
    const geo1 = eciToGeo(x1, y1, z1, date);
    list.push({
      id: 'hist-iss',
      name: 'ISS (ZARYA)',
      noradId: 25544,
      type: 'PAYLOAD',
      country: 'USA/RUS/ESA',
      altitude: geo1.alt,
      lat: geo1.lat,
      lng: geo1.lng
    });

    // 2. Breeze-M Fragment
    // Add small offset to miss distance
    const missOffset = 0.15; // 150 meters in km
    const angle2 = omega_iss * deltaT;
    // We displace the second plane slightly
    const offsetVec = cross(u_iss, v_debris_ortho);
    const x2 = R_ISS * (Math.cos(angle2) * u_iss.x + Math.sin(angle2) * v_debris_ortho.x) + offsetVec.x * missOffset;
    const y2 = R_ISS * (Math.cos(angle2) * u_iss.y + Math.sin(angle2) * v_debris_ortho.y) + offsetVec.y * missOffset;
    const z2 = R_ISS * (Math.cos(angle2) * u_iss.z + Math.sin(angle2) * v_debris_ortho.z) + offsetVec.z * missOffset;
    const geo2 = eciToGeo(x2, y2, z2, date);
    list.push({
      id: 'hist-breeze',
      name: 'BREEZE-M FRAGMENT',
      noradId: 39999,
      type: 'DEBRIS',
      country: 'RUS',
      altitude: geo2.alt,
      lat: geo2.lat,
      lng: geo2.lng
    });
  }

  return list;
}
