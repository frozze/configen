import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { savedConfigs } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and } from 'drizzle-orm';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [config] = await db
            .select()
            .from(savedConfigs)
            .where(and(eq(savedConfigs.id, id), eq(savedConfigs.userId, session.user.id)));

        if (!config) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json(config);
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, description, configJson, nginxConf, isPublic } = body;

        const [existing] = await db
            .select()
            .from(savedConfigs)
            .where(and(eq(savedConfigs.id, id), eq(savedConfigs.userId, session.user.id)));

        if (!existing) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        await db
            .update(savedConfigs)
            .set({
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(configJson !== undefined && { configJson }),
                ...(nginxConf !== undefined && { nginxConf }),
                ...(isPublic !== undefined && { isPublic }),
                updatedAt: new Date(),
            })
            .where(and(eq(savedConfigs.id, id), eq(savedConfigs.userId, session.user.id)));

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await db
            .delete(savedConfigs)
            .where(and(eq(savedConfigs.id, id), eq(savedConfigs.userId, session.user.id)));

        // check result (different for libSQL/SQLite driver response structure)
        // Usually assuming it succeeded if no error.

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
