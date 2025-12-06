import Fastify from 'fastify';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { db } from './db';
import { todos } from './db/schema';
import { eq, desc } from 'drizzle-orm';

const app = Fastify({
    logger: true,
}).withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(cors, {
    origin: '*', // For local development convenience
});

// Routes
app.after(() => {
    // GET all todos
    app.get('/todos', async () => {
        const allTodos = await db.query.todos.findMany({
            orderBy: [desc(todos.createdAt)],
        });
        return allTodos;
    });

    // CREATE todo
    app.post(
        '/todos',
        {
            schema: {
                body: z.object({
                    title: z.string().min(1),
                    targetDate: z.string().datetime().optional(),
                }),
            },
        },
        async (request) => {
            const { title, targetDate } = request.body;
            const result = await db.insert(todos).values({
                title,
                targetDate: targetDate ? new Date(targetDate) : null,
            }).returning();
            return result[0];
        }
    );

    // UPDATE todo (toggle completion)
    app.patch(
        '/todos/:id',
        {
            schema: {
                params: z.object({
                    id: z.coerce.number(),
                }),
                body: z.object({
                    isCompleted: z.boolean().optional(),
                    title: z.string().optional(),
                    targetDate: z.string().datetime().nullable().optional(),
                    completedBy: z.string().nullable().optional(),
                }),
            },
        },
        async (request, reply) => {
            const { id } = request.params;
            const { isCompleted, title, targetDate, completedBy } = request.body;

            if (isCompleted === undefined && title === undefined && targetDate === undefined) {
                return reply.status(400).send({ message: 'No fields to update' });
            }

            const updateData: any = {};
            if (title !== undefined) updateData.title = title;
            if (targetDate !== undefined) {
                updateData.targetDate = targetDate ? new Date(targetDate) : null;
            }

            if (isCompleted !== undefined) {
                updateData.isCompleted = isCompleted;
                if (isCompleted) {
                    updateData.completedAt = new Date();
                    updateData.completedBy = completedBy || 'Unknown';
                } else {
                    updateData.completedAt = null;
                    updateData.completedBy = null;
                }
            }

            updateData.updatedAt = new Date();

            const result = await db
                .update(todos)
                .set(updateData)
                .where(eq(todos.id, id))
                .returning();

            if (result.length === 0) {
                return reply.status(404).send({ message: 'Todo not found' });
            }

            return result[0];
        }
    );

    // DELETE todo
    app.delete(
        '/todos/:id',
        {
            schema: {
                params: z.object({
                    id: z.coerce.number(),
                }),
            },
        },
        async (request, reply) => {
            const { id } = request.params;
            const result = await db.delete(todos).where(eq(todos.id, id)).returning();

            if (result.length === 0) {
                return reply.status(404).send({ message: 'Todo not found' });
            }

            return { message: 'Deleted successfully' };
        }
    );
});

const start = async () => {
    try {
        await app.listen({ port: 3000, host: '0.0.0.0' });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
