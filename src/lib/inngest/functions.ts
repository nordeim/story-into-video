import { pipelineFunction } from '@/features/pipeline/inngest';

/**
 * Inngest function registrations — import this in the Inngest route handler
 * so all functions are registered with the Inngest server.
 */
export const functions = [pipelineFunction];
