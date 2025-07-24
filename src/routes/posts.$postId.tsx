import { Link, createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { fetchPost } from "../utils/posts";
import { NotFound } from "~/components/NotFound";
import { PostErrorComponent } from "~/components/PostError";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/posts/$postId")({
  loader: ({ params: { postId } }) => fetchPost({ data: postId }),
  errorComponent: PostErrorComponent,
  component: PostComponent,
  notFoundComponent: () => {
    return <NotFound>Post not found</NotFound>;
  },
});

function PostComponent(): React.ReactElement {
  const post = Route.useLoaderData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{post.title}</CardTitle>
        <CardDescription>Post ID: {post.id}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed">{post.body}</p>
      </CardContent>
      <CardFooter>
        <Link
          to="/posts/$postId/deep"
          params={{
            postId: post.id,
          }}
        >
          <Button variant="outline" size="sm">
            Deep View
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
