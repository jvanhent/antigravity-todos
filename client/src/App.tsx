import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetTodos, useCreateTodo, useUpdateTodo, useDeleteTodo } from '../generated/default/default';

function App() {
    const [newTodo, setNewTodo] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [userName, setUserName] = useState('');
    const queryClient = useQueryClient();

    // Generated hook
    const { data: axiosResponse, isLoading, isError } = useGetTodos();
    const todos = axiosResponse?.data;

    const { mutate: createMutate, isPending: isCreating } = useCreateTodo({
        mutation: {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['http://localhost:3000/todos'] });
                setNewTodo('');
                setTargetDate('');
            },
        }
    });

    const { mutate: updateMutate } = useUpdateTodo({
        mutation: {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['http://localhost:3000/todos'] });
            },
        }
    });

    const { mutate: deleteMutate } = useDeleteTodo({
        mutation: {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['http://localhost:3000/todos'] });
            },
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim()) return;
        createMutate({
            data: {
                title: newTodo,
                targetDate: targetDate ? new Date(targetDate).toISOString() : undefined
            }
        });
    };

    if (isLoading) return <div className="p-10 text-center">Loading...</div>;
    if (isError) return <div className="p-10 text-center text-red-500">Error loading todos</div>;

    return (
        <div className="min-h-screen bg-yellow-50 py-10 px-4 flex justify-center">
            <div className="w-full max-w-md">
                <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-500 to-orange-600 text-transparent bg-clip-text">
                    Reactive Todos
                </h1>

                <div className="mb-6">
                    <label className="block text-slate-600 text-sm mb-2">Who are you?</label>
                    <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full px-4 py-2 rounded-lg bg-white border border-yellow-200 focus:outline-none focus:border-yellow-500 transition-colors text-slate-900"
                    />
                </div>

                <form onSubmit={handleSubmit} className="mb-8">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newTodo}
                            onChange={(e) => setNewTodo(e.target.value)}
                            placeholder="What needs to be done?"
                            className="flex-1 px-4 py-3 rounded-lg bg-white border border-yellow-200 focus:outline-none focus:border-yellow-500 transition-colors text-slate-900"
                        />
                        <input
                            type="date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            className="px-4 py-3 rounded-lg bg-white border border-yellow-200 focus:outline-none focus:border-yellow-500 transition-colors text-slate-900"
                        />
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-lg font-bold transition-colors disabled:opacity-50"
                        >
                            Add
                        </button>
                    </div>
                </form>

                <div className="space-y-3">
                    {todos?.map((todo) => (
                        <div
                            key={todo.id}
                            className="flex items-center gap-3 p-4 rounded-lg bg-white border border-yellow-100 shadow-sm group hover:border-yellow-200 transition-colors"
                        >
                            <button
                                onClick={() =>
                                    updateMutate({
                                        id: todo.id,
                                        data: {
                                            isCompleted: !todo.isCompleted,
                                            completedBy: !todo.isCompleted ? userName : null
                                        }
                                    })
                                }
                                className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${todo.isCompleted
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : 'border-yellow-300 hover:border-yellow-500'
                                    }`}
                            >
                                {todo.isCompleted && (
                                    <svg
                                        className="w-4 h-4 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                )}
                            </button>

                            <span
                                className={`flex-1 ${todo.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'
                                    }`}
                            >
                                {todo.title}
                                {todo.targetDate && (() => {
                                    const now = new Date();
                                    const target = new Date(todo.targetDate);
                                    const created = new Date(todo.createdAt!); // createdAt is optional in generated type but always present in DB

                                    // Reset hours for day calculation
                                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());

                                    const diffTime = targetDay.getTime() - today.getTime();
                                    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                    const totalDuration = target.getTime() - created.getTime();
                                    const elapsed = now.getTime() - created.getTime();
                                    const progress = totalDuration > 0
                                        ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
                                        : 100;

                                    // Determine color based on urgency
                                    let progressColor = 'bg-blue-600';
                                    if (daysLeft < 3) progressColor = 'bg-red-500';
                                    else if (daysLeft < 7) progressColor = 'bg-yellow-500';

                                    return (
                                        <div className="mt-2 w-full">
                                            <div className="flex justify-between items-center text-xs mb-1">
                                                <span className="text-yellow-700 font-medium">
                                                    Target: {target.toLocaleDateString()}
                                                </span>
                                                <span className={`font-bold ${daysLeft < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                                                    {daysLeft < 0
                                                        ? `${Math.abs(daysLeft)} days overdue`
                                                        : daysLeft === 0
                                                            ? 'Due today'
                                                            : `${daysLeft} days left`
                                                    }
                                                </span>
                                            </div>
                                            {!todo.isCompleted && (
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                                                    <div
                                                        className={`${progressColor} h-1.5 rounded-full transition-all duration-500`}
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                                {todo.isCompleted && todo.completedBy && (
                                    <span className="block text-xs text-emerald-500 mt-1">
                                        Completed by {todo.completedBy} on {todo.completedAt ? new Date(todo.completedAt).toLocaleString() : ''}
                                    </span>
                                )}
                            </span>

                            <button
                                onClick={() => deleteMutate({ id: todo.id })}
                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all px-2"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                            </button>
                        </div>
                    ))}
                    {todos?.length === 0 && (
                        <div className="text-center text-slate-500 mt-10">
                            No todos yet. Add one above!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
