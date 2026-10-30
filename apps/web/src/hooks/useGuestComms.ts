/* apps/web/src/hooks/useGuestComms.ts — G5 chat/announcements/reviews hooks */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getGuestToken } from './guestPortalApi';
import {
  guestCommsApi,
  type AnnouncementItem,
  type ChatMessageItem,
  type ChatThreadState,
  type ReviewItem,
} from './guestCommsApi';

const tk = () => getGuestToken() ?? '';

export function useChatThread() {
  return useQuery<{ thread: ChatThreadState; messages: ChatMessageItem[] }>({
    queryKey: ['gp-chat'],
    queryFn: () => guestCommsApi.chatThread(tk()),
    enabled: Boolean(getGuestToken()),
    refetchInterval: 1500,
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();
  return useMutation<
    { message: ChatMessageItem; idempotentReplay: boolean },
    Error,
    { body: string; clientId: string }
  >({
    mutationFn: (input) => guestCommsApi.chatSend(tk(), input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gp-chat'] }),
  });
}

export function useCloseChatThread() {
  const queryClient = useQueryClient();
  return useMutation<{ id: string; status: string }, Error, void>({
    mutationFn: () => guestCommsApi.chatClose(tk()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gp-chat'] }),
  });
}

export function useAnnouncements() {
  return useQuery<{ token: string; announcements: AnnouncementItem[] }>({
    queryKey: ['gp-announcements'],
    queryFn: () => guestCommsApi.announcements(tk()),
    enabled: Boolean(getGuestToken()),
  });
}

export function useMyReview() {
  return useQuery<{ token: string; review: ReviewItem | null }>({
    queryKey: ['gp-review'],
    queryFn: () => guestCommsApi.myReview(tk()),
    enabled: Boolean(getGuestToken()),
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation<
    { review: ReviewItem; idempotentReplay: boolean },
    Error,
    { rating: number; title?: string; body: string }
  >({
    mutationFn: (input) => guestCommsApi.submitReview(tk(), input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gp-review'] }),
  });
}
