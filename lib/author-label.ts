const anonymousStudentLabel = "Anonymous Student";

type AuthorLabelSource = {
  author_label?: string | null;
  pseudonym?: string | null;
};

export function getDisplayAuthorLabel(message: AuthorLabelSource) {
  if (isUsefulAuthorLabel(message.author_label)) {
    return message.author_label;
  }

  if (isUsefulAuthorLabel(message.pseudonym)) {
    return message.pseudonym;
  }

  return anonymousStudentLabel;
}

function isUsefulAuthorLabel(value?: string | null): value is string {
  return Boolean(value && value.trim() && value !== anonymousStudentLabel);
}
