// Server-side API route for football-data.org
// Handles API calls server-side to avoid CORS issues and keep API token secure

import { NextRequest, NextResponse } from 'next/server';

const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY || '2a1c8491bcc248bf922be69de6183527';
const BASE_URL = 'https://api.football-data.org/v4';

// In-memory cache to stay under the free-tier rate limit (10 req/min).
// Persists across requests on a warm serverless instance.
const CACHE_TTL_MS = 60_000;
type CacheEntry = { data: unknown; timestamp: number };
const cache = new Map<string, CacheEntry>();
// Dedupe concurrent identical requests so a burst makes only one upstream call
type FetchResult =
  | { ok: true; data: unknown }
  | { ok: false; status: number; statusText: string; details: string };
const inflight = new Map<string, Promise<FetchResult>>();

async function fetchUpstream(endpoint: string, apiKey: string): Promise<FetchResult> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'X-Auth-Token': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const details = await response.text();
    return { ok: false, status: response.status, statusText: response.statusText, details };
  }

  const data = await response.json();
  return { ok: true, data };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json(
      { error: 'Missing endpoint parameter' },
      { status: 400 }
    );
  }

  const apiKey = FOOTBALL_DATA_API_KEY || '2a1c8491bcc248bf922be69de6183527';
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  // Serve fresh cached data if available
  const cached = cache.get(endpoint);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  try {
    console.log('Fetching from football-data.org:', `${BASE_URL}${endpoint}`);

    let requestPromise = inflight.get(endpoint);
    if (!requestPromise) {
      requestPromise = fetchUpstream(endpoint, apiKey);
      inflight.set(endpoint, requestPromise);
    }

    let result: FetchResult;
    try {
      result = await requestPromise;
    } finally {
      inflight.delete(endpoint);
    }

    if (!result.ok) {
      console.error('Football Data API error:', result.status, result.details);

      // On rate-limit or upstream error, serve stale cache if we have any
      if (cached) {
        return NextResponse.json(cached.data);
      }

      return NextResponse.json(
        { 
          error: `Football Data API error: ${result.status} ${result.statusText}`,
          details: result.details
        },
        { status: result.status }
      );
    }

    console.log('Successfully fetched data from football-data.org');

    cache.set(endpoint, { data: result.data, timestamp: Date.now() });

    return NextResponse.json(result.data);
  } catch (error) {
    // On network error, serve stale cache if available
    if (cached) {
      return NextResponse.json(cached.data);
    }
    console.error('Error calling football-data.org API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch data from football-data.org',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
