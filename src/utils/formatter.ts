export const clean = (str: string | null | undefined) =>
  str?.replace("\n", "").trim() || "";

export const cleanTemType = (str: string | null | undefined) =>
  clean(str).replace("type", "").trim().toLowerCase();
