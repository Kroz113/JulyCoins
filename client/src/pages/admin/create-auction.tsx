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
import { InsertAuction } from "@shared/schema";
import { useLocation } from "wouter";

// Schema for auction creation
const auctionSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  startDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date >= new Date(new Date().setHours(0, 0, 0, 0));
  }, "La fecha de inicio debe ser hoy o en el futuro"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
  endDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, "La fecha de cierre es requerida"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
  minimumBid: z.string().transform(Number).refine((val) => val > 0, "La puja mínima debe ser mayor a 0"),
})
.refine((data) => {
  const start = new Date(`${data.startDate}T${data.startTime}`);
  const end = new Date(`${data.endDate}T${data.endTime}`);
  return end > start;
}, {
  message: "La fecha de cierre debe ser posterior a la fecha de inicio",
  path: ["endDate"],
});

type AuctionFormValues = z.infer<typeof auctionSchema>;

export default function CreateAuction() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();

  const form = useForm<AuctionFormValues>({
    resolver: zodResolver(auctionSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: new Date().toISOString().split('T')[0],
      startTime: new Date().toTimeString().substring(0, 5),
      endDate: "",
      endTime: "",
      minimumBid: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: AuctionFormValues) => {
    setIsSubmitting(true);
    try {
      // Combine dates and times
      const startDateObj = new Date(`${values.startDate}T${values.startTime}`);
      const endDateObj = new Date(`${values.endDate}T${values.endTime}`);

      // Prepare data for API
      const auctionData: Omit<InsertAuction, "createdBy"> = {
        title: values.title,
        description: values.description,
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString(),
        minimumBid: Number(values.minimumBid),
      };

      // Send request to API
      await apiRequest("POST", "/api/auctions", auctionData);

      // Show success message
      toast({
        title: "Subasta creada",
        description: "La subasta ha sido creada exitosamente.",
      });

      // Invalidate auctions cache
      queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });

      // Reset form
      form.reset();

      // Navigate to dashboard
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Error creating auction:", error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al crear la subasta.",
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
          <h1 className="text-2xl font-bold text-gray-800">Crear Nueva Subasta</h1>
          <p className="text-gray-500">Define los detalles de la subasta para los estudiantes</p>
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
                      <FormLabel>Título de la Subasta</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Punto Extra en Examen" 
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
                      <FormLabel>Descripción del Premio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe en detalle el premio de la subasta..." 
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
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Inicio</FormLabel>
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
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Inicio</FormLabel>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Cierre</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            min={form.watch('startDate') || new Date().toISOString().split('T')[0]}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Cierre</FormLabel>
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
                  name="minimumBid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Puja Mínima (JuliCoins)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="Cantidad mínima para participar" 
                          {...field} 
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Cantidad mínima de JuliCoins necesaria para participar en la subasta.
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
                    {isSubmitting ? "Publicando..." : "Publicar Subasta"}
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
