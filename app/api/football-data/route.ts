// Server-side API route for football-data.org
// Handles API calls server-side to avoid CORS issues and keep API token secure

import { NextRequest, NextResponse } from 'next/server';

const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const BASE_URL = 'https://api.football-data.org/v4';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json(
      { error: 'Missing endpoint parameter' },
      { status: 400 }
    );
  }

  if (!FOOTBALL_DATA_API_KEY) {
    console.error('FOOTBALL_DATA_API_KEY not configured');
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  try {
    const url = `${BASE_URL}${endpoint}`;
    console.log('Fetching from football-data.org:', url);
    
    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': FOOTBALL_DATA_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Football Data API error:', response.status, errorText);
      
      return NextResponse.json(
        { 
          error: `Football Data API error: ${response.status} ${response.statusText}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Successfully fetched data from football-data.org');
    
    return NextResponse.json(data);
  } catch (error) {
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
