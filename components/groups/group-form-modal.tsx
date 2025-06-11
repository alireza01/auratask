"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast"
import type { User, GuestUser, UserSettings, TaskGroup } from "@/types"
import type { ControllerRenderProps } from "react-hook-form"

const groupFormSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  emoji: z.string().optional(),
})

type GroupFormData = z.infer<typeof groupFormSchema>

interface GroupFormModalProps {
  user: User | null
  guestUser: GuestUser | null
  settings: UserSettings | null
  isOpen: boolean
  onClose: () => void
  onGroupSaved: () => void
  groupToEdit?: TaskGroup | null
}

export default function GroupFormModal({
  isOpen,
  onClose,
  onGroupSaved,
  groupToEdit,
}: GroupFormModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<GroupFormData>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: groupToEdit?.name || "",
      emoji: groupToEdit?.emoji || "",
    },
  })

  const onSubmit = async (_formData: GroupFormData) => {
    try {
      setIsSubmitting(true)
      // Handle form submission here
      await onGroupSaved()
      toast({
        title: "Success",
        description: groupToEdit ? "Group updated successfully" : "Group created successfully",
        variant: "default",
      })
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save group. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{groupToEdit ? "Edit Group" : "Create New Group"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: ControllerRenderProps<GroupFormData, "name"> }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter group name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emoji"
              render={({ field }: { field: ControllerRenderProps<GroupFormData, "emoji"> }) => (
                <FormItem>
                  <FormLabel>Emoji (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter emoji" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : groupToEdit ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
