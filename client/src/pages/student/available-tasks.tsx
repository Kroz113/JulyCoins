import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/layouts/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Clock } from "lucide-react";
import { TaskWithSubmission } from "@shared/schema";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function AvailableTasks() {
  const [, navigate] = useLocation();

  // Fetch available tasks
  const { data: tasks, isLoading } = useQuery<TaskWithSubmission[]>({
    queryKey: ["/api/tasks"],
  });

  // Check if a task has passed its due date
  const isTaskExpired = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Trabajos Disponibles</h1>
          <p className="text-gray-500">Completa trabajos para ganar JuliCoins</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tasks?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay trabajos disponibles</h3>
            <p className="text-gray-500">Vuelve más tarde para ver nuevos trabajos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tasks?.map((task) => (
              <Card key={task.id} className={task.hasSubmitted ? "opacity-75" : ""}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 mb-2">{task.title}</h2>
                      <p className="text-gray-600 text-sm mb-4">{task.description}</p>
                    </div>
                    <div className="bg-primary-100 text-primary-700 font-semibold text-sm px-3 py-1 rounded-full">
                      {task.coinsReward} JuliCoins
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Clock className="h-4 w-4 mr-1" />
                    {isTaskExpired(task.dueDate) ? (
                      <span className="text-red-500">Cerrado: {new Date(task.dueDate).toLocaleDateString()} - {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    ) : (
                      <>Cierre: {new Date(task.dueDate).toLocaleDateString()} - {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    {task.hasSubmitted ? (
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {task.submission?.status === 'pending' && "Entregado - Pendiente de revisión"}
                        {task.submission?.status === 'approved' && "Aprobado"}
                        {task.submission?.status === 'rejected' && "Rechazado"}
                      </div>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        disabled={isTaskExpired(task.dueDate)}
                      >
                        {isTaskExpired(task.dueDate) ? "Plazo expirado" : "Entregar Trabajo"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
