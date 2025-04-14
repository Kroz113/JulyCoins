import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/layouts/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { InsertTask } from "@shared/schema";
import { useLocation } from "wouter";

// Schema for task creation
const taskSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  dueDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date > new Date();
  }, "La fecha de entrega debe ser en el futuro"),
  dueTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
  coinsReward: z.string().transform(Number).refine((val) => val > 0, "La recompensa debe ser mayor a 0"),
});

type TaskFormValues = z.infer<typeof taskSchema>;

export default function CreateTask() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      dueTime: "",
      coinsReward: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: TaskFormValues) => {
    setIsSubmitting(true);
    try {
      // Combine date and time
      const dueDateObj = new Date(values.dueDate);
      const [hours, minutes] = values.dueTime.split(':').map(Number);
      dueDateObj.setHours(hours, minutes);

      // Prepare data for API
      const taskData: Omit<InsertTask, "createdBy"> = {
        title: values.title,
        description: values.description,
        dueDate: dueDateObj.toISOString(),
        coinsReward: Number(values.coinsReward),
      };

      // Send request to API
      await apiRequest("POST", "/api/tasks", taskData);

      // Show success message
      toast({
        title: "Trabajo creado",
        description: "El trabajo ha sido creado exitosamente.",
      });

      // Invalidate tasks cache
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });

      // Reset form
      form.reset();

      // Navigate to dashboard
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al crear el trabajo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Crear Nuevo Trabajo</h1>
          <p className="text-gray-500">Asigna trabajos y JuliCoins a los estudiantes</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título del Trabajo</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Ensayo sobre Literatura Chilena" 
                          {...field} 
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Instrucciones detalladas del trabajo..." 
                          rows={4} 
                          {...field} 
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Entrega</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            min={new Date().toISOString().split('T')[0]}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Entrega</FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            {...field} 
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="coinsReward"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>JuliCoins a Otorgar</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="Cantidad de JuliCoins" 
                          {...field} 
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Cantidad de monedas que recibirán los estudiantes por completar este trabajo.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Publicando..." : "Publicar Trabajo"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
