import { useMockQuery } from './useMockQuery';

export function useGuestProfile() {
  return useMockQuery(['guest-profile'], async () => {
    const { guestProfile } = await import('../app/guest-portal/data.js');
    return guestProfile;
  });
}

export function useGuestStays() {
  return useMockQuery(['guest-stays'], async () => {
    const { guestStays } = await import('../app/guest-portal/data.js');
    return guestStays;
  });
}

export function useGuestAnnouncements() {
  return useMockQuery(['guest-announcements'], async () => {
    const { guestAnnouncements } = await import('../app/guest-portal/data.js');
    return guestAnnouncements;
  });
}

export function useRoomServiceMenu() {
  return useMockQuery(['room-service-menu'], async () => {
    const { roomServiceMenu } = await import('../app/guest-portal/data.js');
    return roomServiceMenu;
  });
}
