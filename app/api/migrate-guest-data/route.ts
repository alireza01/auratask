import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guest_user_id, new_user_id } = await request.json()

    if (!guest_user_id || !new_user_id) {
      return NextResponse.json({ message: "Missing user IDs" }, { status: 400 })
    }

    // 1. Migrate task groups
    const { data: groups, error: groupsError } = await supabase
      .from("task_groups")
      .select("*")
      .eq("user_id", guest_user_id)

    if (groupsError) throw groupsError

    const groupIdMap = new Map()

    for (const group of groups || []) {
      const { data: newGroup, error: newGroupError } = await supabase
        .from("task_groups")
        .insert({
          ...group,
          id: undefined,
          user_id: new_user_id,
          created_at: undefined,
          updated_at: undefined,
        })
        .select()
        .single()

      if (newGroupError) throw newGroupError

      groupIdMap.set(group.id, newGroup.id)
    }

    // 2. Migrate tags
    const { data: tags, error: tagsError } = await supabase.from("tags").select("*").eq("user_id", guest_user_id)

    if (tagsError) throw tagsError

    const tagIdMap = new Map()

    for (const tag of tags || []) {
      const { data: newTag, error: newTagError } = await supabase
        .from("tags")
        .insert({
          ...tag,
          id: undefined,
          user_id: new_user_id,
          created_at: undefined,
        })
        .select()
        .single()

      if (newTagError) throw newTagError

      tagIdMap.set(tag.id, newTag.id)
    }

    // 3. Migrate tasks
    const { data: tasks, error: tasksError } = await supabase.from("tasks").select("*").eq("user_id", guest_user_id)

    if (tasksError) throw tasksError

    const taskIdMap = new Map()

    for (const task of tasks || []) {
      const { data: newTask, error: newTaskError } = await supabase
        .from("tasks")
        .insert({
          ...task,
          id: undefined,
          user_id: new_user_id,
          group_id: task.group_id ? groupIdMap.get(task.group_id) : null,
          created_at: undefined,
          updated_at: undefined,
        })
        .select()
        .single()

      if (newTaskError) throw newTaskError

      taskIdMap.set(task.id, newTask.id)
    }

    // 4. Migrate subtasks
    for (const oldTaskId of taskIdMap.keys()) {
      const { data: subtasks, error: subtasksError } = await supabase
        .from("subtasks")
        .select("*")
        .eq("task_id", oldTaskId)

      if (subtasksError) throw subtasksError

      for (const subtask of subtasks || []) {
        await supabase.from("subtasks").insert({
          ...subtask,
          id: undefined,
          task_id: taskIdMap.get(oldTaskId),
          created_at: undefined,
          updated_at: undefined,
        })
      }
    }

    // 5. Migrate task-tag relationships
    for (const oldTaskId of taskIdMap.keys()) {
      const { data: taskTags, error: taskTagsError } = await supabase
        .from("task_tags")
        .select("*")
        .eq("task_id", oldTaskId)

      if (taskTagsError) throw taskTagsError

      for (const taskTag of taskTags || []) {
        if (tagIdMap.has(taskTag.tag_id)) {
          await supabase.from("task_tags").insert({
            task_id: taskIdMap.get(oldTaskId),
            tag_id: tagIdMap.get(taskTag.tag_id),
          })
        }
      }
    }

    return NextResponse.json({
      message: "Data migration successful",
      stats: {
        groups: groupIdMap.size,
        tags: tagIdMap.size,
        tasks: taskIdMap.size,
      },
    })
  } catch (error) {
    console.error("Error migrating guest data:", error)
    return NextResponse.json({ message: "Failed to migrate guest data" }, { status: 500 })
  }
}
