import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { savedConfigs } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, desc } from 'drizzle-orm';
import { createDefaultConfig } from '@/stores/configStore'; // For validation or defaults

export async function GET(_request: Request) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const configs = await db
            .select()
            .from(savedConfigs)
            .where(eq(savedConfigs.userId, session.user.id))
            .orderBy(desc(savedConfigs.updatedAt));

        return NextResponse.json(configs);
    } catch (error) {
        console.error('Failed to fetch configs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, description, configJson, nginxConf, isPublic } = body;

        if (!name || !configJson || !nginxConf) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newConfig = {
            id: crypto.randomUUID(),
            userId: session.user.id,
            name,
            description,
            configJson, // Should be passed as JSON object or string? Schema says mode: 'json'
            nginxConf,
            isPublic: isPublic || false,
            shareSlug: isPublic ? crypto.randomUUID().slice(0, 8) : null,
        };

        await db.insert(savedConfigs).values(newConfig);

        return NextResponse.json(newConfig, { status: 201 });
    } catch (error) {
        console.error('Failed to create config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
