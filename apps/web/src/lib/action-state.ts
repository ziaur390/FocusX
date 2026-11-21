export type FormState = { error?: string } | undefined;

export type FormAction = (state: FormState, form: FormData) => Promise<FormState>;
