import TaskForm from "../task-form";

export default function EditTaskPage({ params }: { params: { id: string } }) {
  return <TaskForm taskId={params.id} />;
}
