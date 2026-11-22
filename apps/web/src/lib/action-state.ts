export type FormState = { error?: string; notice?: string } | undefined;

export type FormAction = (state: FormState, form: FormData) => Promise<FormState>;
