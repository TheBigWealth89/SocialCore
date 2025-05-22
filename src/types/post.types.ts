export type contentBlock = {
  type: "text" | "image" | "video";
  content: string;
  order: number;
};

export type PostCreatePayload = {
  title: string;
  content: contentBlock[];
  tags?: string[];
};
