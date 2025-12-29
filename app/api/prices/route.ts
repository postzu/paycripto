import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    const vs_currencies = searchParams.get('vs_currencies');

    const date = searchParams.get('date');

    if (!ids || !vs_currencies) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    try {
        let url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs_currencies}`;

        if (date) {
            // CoinGecko history endpoint: /coins/{id}/history?date={dd-mm-yyyy}
            // Note: This endpoint only supports one coin ID at a time effectively for our simple proxy structure
            // We will assume 'ids' contains a single ID when 'date' is used, or just use the first one.
            const firstId = ids.split(',')[0];
            url = `https://api.coingecko.com/api/v3/coins/${firstId}/history?date=${date}`;
        }

        const response = await fetch(
            url,
            {
                headers: {
                    'Accept': 'application/json',
                },
                next: { revalidate: 3600 } // Cache historical data longer (1 hour)
            }
        );

        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (date) {
            // Normalize historical data to match simple price format
            // History response: data.market_data.current_price[vs_currency]
            const firstId = ids.split(',')[0];
            const normalizedData: Record<string, Record<string, number>> = {
                [firstId]: {}
            };

            const currencies = vs_currencies.split(',');
            currencies.forEach(curr => {
                const val = data.market_data?.current_price?.[curr];
                if (typeof val === 'number') {
                    normalizedData[firstId][curr] = val;
                }
            });
            return NextResponse.json(normalizedData);
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 200 });
    }
}
