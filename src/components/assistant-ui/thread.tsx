import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ErrorPrimitive,
} from "@assistant-ui/react";
import type { FC } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
  CopyIcon,
  CheckIcon,
  PencilIcon,
  RefreshCwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Square,
} from "lucide-react";

import { TooltipIconButton } from "~/components/assistant-ui/tooltip-icon-button";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/button";
import { MarkdownText } from "./markdown-text";
import { cn } from "~/lib/utils";
import { ToolFallback } from "./tool-fallback";
// import { SettingsTool } from "./settings-tool";
import { TripPlanningTool } from "./trip-planning-tool";
import { ShoppingTool } from "./shopping-tool";
import { EnhancedComposer } from "./enhanced-composer";
import styles from "./thread.module.css";

export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root
      className={styles.threadRoot}
      style={{
        ["--thread-max-width" as string]: "48rem",
        ["--thread-padding-x" as string]: "1rem",
      }}
    >
      <ThreadPrimitive.Viewport className={styles.threadViewport}>
        {/* <ThreadWelcome />  */}

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            EditComposer,
            AssistantMessage,
          }}
        />

        <ThreadPrimitive.If empty={false}>
          <motion.div className={styles.threadSpacer} />
        </ThreadPrimitive.If>
      </ThreadPrimitive.Viewport>

      <Composer />
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className={styles.scrollToBottomButton}
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};


const ThreadWelcomeSuggestions: FC = () => {
  return (
    <div className={styles.welcomeSuggestions}>
      {[
        {
          title: "Compare options",
          action: "Compare options",
        },
        {
          title: "Show more",
          action: `show more`,
        },
      ].map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={styles.suggestionItem}
        >
          <ThreadPrimitive.Suggestion
            prompt={suggestedAction.action}
            method="replace"
            autoSend
            asChild
          >
            <Button
              variant="ghost"
              className={styles.suggestionButton}
              aria-label={suggestedAction.action}
            >
              <div className={styles.suggestionContent}>
                <span className={styles.suggestionTitle}>
                  {suggestedAction.title}
                </span>
              </div>
            </Button>
          </ThreadPrimitive.Suggestion>
        </motion.div>
      ))}
    </div>
  );
};

const Composer: FC = () => {
  return (
    <div className={styles.composer}>
      <ThreadScrollToBottom />
      <ThreadPrimitive.Empty>
        <ThreadWelcomeSuggestions />
      </ThreadPrimitive.Empty>
      <ComposerPrimitive.Root className={styles.composerRoot}>
        <EnhancedComposer
          placeholder="Send a message... (try @shopping, @trip, @tabs)"
          onToolSelect={(tool) => {
            console.log('Tool selected:', tool);
            // Auto-trigger the selected tool when user picks it from @ mentions
            // This could modify the input to include the trigger text
          }}
        />
        <ComposerAction />
      </ComposerPrimitive.Root>
    </div>
  );
};

const ComposerAction: FC = () => {
  const handleFileAttachment = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,text/*,.pdf,.doc,.docx,.txt,.md';
    
    input.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        console.log('Files selected:', Array.from(files).map(f => ({ name: f.name, size: f.size, type: f.type })));
        // TODO: Handle file attachments - could upload to server or convert to base64
        // For now, just show an alert with file info
        const fileNames = Array.from(files).map(f => f.name).join(', ');
        alert(`Files selected: ${fileNames}\n\nFile attachment handling is not yet fully implemented.`);
      }
    };
    
    input.click();
  };

  return (
    <div className={styles.composerAction}>
      <TooltipIconButton
        tooltip="Attach file"
        variant="ghost"
        className={styles.attachButton}
        onClick={handleFileAttachment}
      >
        <PlusIcon />
      </TooltipIconButton>

      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <Button
            type="submit"
            variant="default"
            className={styles.sendButton}
            aria-label="Send message"
          >
            <ArrowUpIcon className={styles.sendButtonIcon} />
          </Button>
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>

      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="default"
            className={styles.cancelButton}
            aria-label="Stop generating"
          >
            <Square className={styles.cancelButtonIcon} />
          </Button>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </div>
  );
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className={styles.messageError}>
        <ErrorPrimitive.Message className={styles.messageErrorText} />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root asChild>
      <motion.div
        className={styles.assistantMessage}
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role="assistant"
      >
        <div className={styles.assistantAvatar}>
          <StarIcon size={14} />
        </div>

        <div className={styles.assistantContent}>
          <MessagePrimitive.Content
            components={{
              Text: MarkdownText,
              tools: { 
                by_name: {
                  // settings: SettingsTool,
                  tripPlanning: TripPlanningTool,
                  shopping: ShoppingTool,
                },
                Fallback: ToolFallback 
              },
            }}
          />
          <MessageError />
        </div>

        <AssistantActionBar />

        <BranchPicker className={cn(styles.branchPicker, "col-start-2 row-start-2 mr-2 -ml-2")} />
      </motion.div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className={styles.assistantActionBar}
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <MessagePrimitive.If copied>
            <CheckIcon />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root asChild>
      <motion.div
        className={styles.userMessage}
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role="user"
      >
        <UserActionBar />

        <div className={styles.userMessageBubble}>
          <MessagePrimitive.Content components={{ Text: MarkdownText }} />
        </div>

        <BranchPicker className={cn(styles.userBranchPicker, "col-span-full col-start-1 row-start-3 -mr-1 justify-end")} />
      </motion.div>
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className={styles.userActionBar}
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <div className={styles.editComposer}>
      <ComposerPrimitive.Root className={styles.editComposerRoot}>
        <ComposerPrimitive.Input
          className={styles.editComposerInput}
          autoFocus
        />

        <div className={styles.editComposerActions}>
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost" size="sm" aria-label="Cancel edit">
              Cancel
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button size="sm" aria-label="Update message">
              Update
            </Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </div>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(styles.branchPickerRoot, className)}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className={styles.branchPickerText}>
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};

const StarIcon = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 0L9.79611 6.20389L16 8L9.79611 9.79611L8 16L6.20389 9.79611L0 8L6.20389 6.20389L8 0Z"
      fill="currentColor"
    />
  </svg>
);
