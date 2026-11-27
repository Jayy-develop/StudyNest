export interface User {
  id: number;
  name: string;
  email: string;
  timezone: string;
  daily_study_minutes: number;
  preferred_study_time: "morning" | "afternoon" | "evening" | "night";
  notification_preferences?: {
    schedule_reminder?: boolean;
    task_reminder?: boolean;
    exam_reminder?: boolean;
    study_session_reminder?: boolean;
    minutes_before?: number;
  } | null;
}

export interface Course {
  id: number;
  user_id: number;
  name: string;
  code?: string | null;
  credits?: number | null;
  lecturer?: string | null;
  semester?: string | null;
  color: string;
  description?: string | null;
  materials_count?: number;
  schedules_count?: number;
  quizzes_count?: number;
  open_tasks_count?: number;
  completed_tasks_count?: number;
  materials?: Material[];
  schedules?: Schedule[];
  tasks?: TaskItem[];
  quizzes?: Quiz[];
  study_sessions?: StudySession[];
}

export interface Material {
  id: number;
  user_id: number;
  course_id: number;
  title: string;
  original_filename: string;
  mime_type: string;
  file_extension: string;
  file_size: number;
  status: "queued" | "processing" | "completed" | "failed";
  error_message?: string | null;
  page_count?: number | null;
  summary?: string | null;
  processed_at?: string | null;
  created_at: string;
  chunks_count?: number;
  course?: Pick<Course, "id" | "name" | "code" | "color">;
}

export interface Citation {
  material_id: number;
  material_title: string;
  page_number?: number | null;
  section_title?: string | null;
  score: number;
  excerpt: string;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  role: "user" | "assistant" | "system";
  content: string;
  citations?: Citation[] | null;
  metadata?: {
    used_documents?: boolean;
    explanation_mode?: string;
    provider?: string;
  } | null;
  created_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  course_id?: number | null;
  title: string;
  explanation_mode: "concise" | "beginner" | "deep" | "examples" | "exam_prep";
  selected_material_ids?: number[] | null;
  updated_at: string;
  course?: Pick<Course, "id" | "name" | "code" | "color"> | null;
  messages?: ChatMessage[];
}

export interface Question {
  id: number;
  quiz_id: number;
  material_id?: number | null;
  order_index: number;
  type: "multiple_choice" | "essay";
  prompt: string;
  options?: string[] | null;
  correct_answer: string;
  explanation?: string | null;
  topic?: string | null;
  source_reference?: string | null;
  is_ai_generated: boolean;
}

export interface QuizAnswer {
  id: number;
  question_id: number;
  user_answer?: string | null;
  is_correct: boolean;
  earned_points: number;
  ai_feedback?: string | null;
  question?: Question;
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  score: number;
  correct_count: number;
  total_questions: number;
  weak_topics?: string[] | null;
  submitted_at?: string | null;
  answers?: QuizAnswer[];
}

export interface Quiz {
  id: number;
  course_id: number;
  title: string;
  question_type: "multiple_choice" | "essay" | "mixed";
  difficulty: "easy" | "medium" | "hard";
  question_count: number;
  source_material_ids?: number[] | null;
  is_ai_generated: boolean;
  created_at: string;
  questions_count?: number;
  attempts_count?: number;
  course?: Pick<Course, "id" | "name" | "code" | "color">;
  questions?: Question[];
  attempts?: QuizAttempt[];
}

export interface Schedule {
  id: number;
  course_id?: number | null;
  title: string;
  type: "lecture" | "lab" | "exam" | "activity";
  is_recurring: boolean;
  day_of_week?: number | null;
  specific_date?: string | null;
  start_time: string;
  end_time: string;
  location?: string | null;
  notes?: string | null;
  course?: Pick<Course, "id" | "name" | "code" | "color"> | null;
}

export interface TaskItem {
  id: number;
  course_id?: number | null;
  title: string;
  description?: string | null;
  due_at?: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in_progress" | "completed";
  estimated_minutes?: number | null;
  completed_at?: string | null;
  course?: Pick<Course, "id" | "name" | "code" | "color"> | null;
}

export interface Reminder {
  id: number;
  title: string;
  remind_at: string;
  minutes_before: number;
  channel: string;
  status: "pending" | "sent" | "dismissed";
}

export interface StudySession {
  id: number;
  study_plan_id: number;
  course_id?: number | null;
  task_id?: number | null;
  material_id?: number | null;
  title: string;
  topic?: string | null;
  session_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  priority: string;
  status: "proposed" | "approved" | "rejected" | "completed" | "skipped";
  rationale?: string | null;
  course?: Pick<Course, "id" | "name" | "code" | "color"> | null;
  task?: Pick<TaskItem, "id" | "title" | "due_at"> | null;
  material?: Pick<Material, "id" | "title"> | null;
}

export interface StudyPlan {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  status: "draft" | "active" | "approved";
  goal?: string | null;
  ai_rationale?: string | null;
  sessions: StudySession[];
}

export interface DashboardPayload {
  greeting: string;
  today_date: string;
  courses: Array<Pick<Course, "id" | "name" | "code" | "color">>;
  weekly_matrix: Array<{
    course_id: number;
    label: string;
    course_name: string;
    cells: Array<{
      date: string;
      day_label: string;
      intensity: number;
    }>;
  }>;
  today_schedules: Schedule[];
  upcoming_tasks: TaskItem[];
  upcoming_assessments: Schedule[];
  pending_reminders: Reminder[];
  progress: {
    courses_count: number;
    materials_count: number;
    completed_materials_count: number;
    tasks_total: number;
    tasks_completed: number;
    study_sessions_total: number;
    study_sessions_completed: number;
    average_quiz_score: number | null;
  };
  recent_activity: Array<{
    type: string;
    title: string;
    subtitle: string;
    timestamp: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    action_href: string;
    action_label: string;
  }>;
}
