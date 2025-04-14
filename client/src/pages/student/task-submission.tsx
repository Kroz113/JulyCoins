import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/layouts/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/upload";
import { Loader2, ArrowLeft, Clock } from "lucide-react";
import { TaskWithSubmission } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Schema for submission
const submissionSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  comment: z.string().optional(),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;

export default function TaskSubmission() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [match, params] = useRoute<{ id: string }>("/tasks/:id");
  const taskId = match ? parseInt(params.id) : 0;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch task details
  const { data: task, isLoading } = useQuery<TaskWithSubmission>({
    queryKey: [`/api/tasks/${taskId}`],
    enabled: !!taskId,
  });

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      title: "",
      comment: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: SubmissionFormValues) => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Debes adjuntar un archivo",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("taskId", taskId.toString());
      formData.append("title", values.title);
      if (values.comment) {
        formData.append("comment", values.comment);
      }
      formData.append("file", selectedFile);

      const response = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al enviar el trabajo");
      }

      // Show success message
      toast({
        title: "Trabajo enviado",
        description: "Tu trabajo ha sido enviado correctamente.",
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });

      // Navigate back to tasks
      navigate("/tasks");
    } catch (error) {
      console.error("Error submitting task:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al enviar el trabajo",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if the task has passed its due date
  const isTaskExpired = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!task) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="mb-6">
            <Button variant="ghost" className="text-primary-600" onClick={() => navigate("/tasks")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Trabajos Disponibles
            </Button>
          </div>
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Trabajo no encontrado</h3>
            <p className="text-gray-500">El trabajo que buscas no existe o no tienes acceso a él</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (task.hasSubmitted) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="mb-6">
            <Button variant="ghost" className="text-primary-600" onClick={() => navigate("/tasks")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Trabajos Disponibles
            </Button>
          </div>
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Trabajo ya enviado</h3>
            <p className="text-gray-500">Ya has enviado este trabajo y está pendiente de revisión</p>
            <Button className="mt-6" onClick={() => navigate("/tasks")}>
              Ver otros trabajos
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isTaskExpired(task.dueDate)) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="mb-6">
            <Button variant="ghost" className="text-primary-600" onClick={() => navigate("/tasks")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Trabajos Disponibles
            </Button>
          </div>
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Plazo expirado</h3>
            <p className="text-gray-500">El plazo de entrega para este trabajo ha terminado</p>
            <Button className="mt-6" onClick={() => navigate("/tasks")}>
              Ver otros trabajos
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6">
          <Button variant="ghost" className="text-primary-600" onClick={() => navigate("/tasks")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Trabajos Disponibles
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Entregar Trabajo</h1>
          <p className="text-gray-500">{task.title} - {task.coinsReward} JuliCoins</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Descripción del Trabajo</h2>
              <p className="text-gray-600">{task.description}</p>
              
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                Fecha límite: {new Date(task.dueDate).toLocaleDateString()} - {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Título de tu Trabajo
                  </label>
                  <Input
                    id="title"
                    placeholder="Ej: La Independencia de Chile: Causas y Consecuencias"
                    {...form.register("title")}
                    error={form.formState.errors.title?.message}
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                    Comentarios (opcional)
                  </label>
                  <Textarea
                    id="comment"
                    rows={3}
                    placeholder="Algún comentario adicional sobre tu trabajo..."
                    {...form.register("comment")}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adjuntar Archivo</label>
                  <FileUpload
                    onFileChange={setSelectedFile}
                    buttonText="Seleccionar archivo"
                    description="PDF, DOCX, JPG o PNG (máx. 10MB)"
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto" 
                    disabled={isSubmitting || !selectedFile}
                  >
                    {isSubmitting ? "Enviando..." : "Enviar Trabajo"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
