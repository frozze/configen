import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { savedConfigs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    try {
        const [config] = await db
            .select()
            .from(savedConfigs)
            .where(and(eq(savedConfigs.shareSlug, slug), eq(savedConfigs.isPublic, true)));

        if (!config) {
            return NextResponse.json({ error: 'Not found or private' }, { status: 404 });
        }

        return NextResponse.json(config);
    } catch (_error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
