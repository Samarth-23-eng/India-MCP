/** Timeline event for execution tracing */
export interface TimelineEvent {
  phase: 'request_received' | 'auth_validated' | 'process_spawned' | 'executing' | 'completed' | 'error';
  timestamp: number;
  elapsed: number;
  error?: string;
}
