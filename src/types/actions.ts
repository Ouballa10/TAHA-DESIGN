export interface ActionState {
  success: boolean;
  message?: string;
  error?: string;
  redirectTo?: string;
  fieldErrors?: Record<string, string>;
}

export const initialActionState: ActionState = {
  success: false,
};
