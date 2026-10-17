/* apps/web/src/api/meal-plans.ts — T7 */
import { apiGet, apiPost, apiPatch, apiDelete } from './client';

export interface RestaurantRow {
  id: string;
  name: string;
  type: string;
  cuisine: string | null;
  capacity: number;
  operatingHours: string | null;
  location: string | null;
  isActive: boolean;
  _count?: { mealPlans: number };
}

export interface MealPlanRow {
  id: string;
  name: string;
  code: string;
  boardBasis: 'RO' | 'BB' | 'HB' | 'FB' | 'AI' | 'UAI';
  price: number;
  currency: string;
  taxInclusive: boolean;
  autoPost: boolean;
  postTime: string;
  restaurantId: string | null;
  restaurant: { id: string; name: string; type: string } | null;
  description: string | null;
  inclusions: string[];
  exclusions: string[];
  childUnder6: string;
  childUnder12: string;
  childUnder16: string;
  seasonality: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  _count?: { assignments: number };
}

export interface MealPlanAssignmentRow {
  id: string;
  reservationId: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  dailyRate: number;
  status: string;
  mealPlan: {
    id: string;
    name: string;
    code: string;
    boardBasis: string;
    price: number;
    currency: string;
  };
  reservation: {
    id: string;
    confirmationNumber: string;
    arrivalDate: string;
    departureDate: string;
    status: string;
    adults: number;
    children: number;
    guest: {
      id: string;
      firstName: string;
      lastName: string;
      preferences: { key: string; value: string }[];
    };
  };
}

export interface MealPostingRow {
  id: string;
  date: string;
  amount: number;
  status: 'pending' | 'posted' | 'failed' | 'skipped';
  folioItemId: string | null;
  error: string | null;
  retryCount: number;
  postedAt: string | null;
  assignment: {
    mealPlan: { id: string; name: string; code: string; currency: string };
    reservation: {
      id: string;
      confirmationNumber: string;
      guest: { firstName: string; lastName: string };
    };
  };
}

export interface CoversForecast {
  date: string;
  totalCovers: number;
  totalAdults: number;
  totalChildren: number;
  planBreakdown: {
    plan: {
      id: string;
      name: string;
      code: string;
      boardBasis: string;
      restaurant: { name: string } | null;
    };
    covers: number;
    adults: number;
    children: number;
    reservations: {
      confirmationNumber: string;
      status: string;
      guest: string;
      adults: number;
      children: number;
      dietary: string[];
    }[];
  }[];
  dietaryFlags: string[];
}

export const mealPlansApi = {
  list: (params: Record<string, unknown>) =>
    apiGet('/v1/meal-plans', params) as Promise<{
      data: MealPlanRow[];
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>,
  summary: (propertyId?: string) =>
    apiGet('/v1/meal-plans/summary', propertyId ? { propertyId } : undefined) as Promise<{
      data: {
        activePlans: number;
        activeAssignments: number;
        postedToday: number;
        failedToday: number;
        monthRevenue: number;
        currency: string;
      };
    }>,
  create: (body: Record<string, unknown>) =>
    apiPost('/v1/meal-plans', body) as Promise<{ data: MealPlanRow }>,
  update: (id: string, body: Record<string, unknown>) =>
    apiPatch(`/v1/meal-plans/${id}`, body) as Promise<{ data: MealPlanRow }>,
  remove: (id: string) =>
    apiDelete(`/v1/meal-plans/${id}`) as Promise<{
      data: { deleted: boolean; deactivated: boolean };
    }>,

  restaurants: (propertyId?: string) =>
    apiGet('/v1/meal-plans/restaurants', propertyId ? { propertyId } : undefined) as Promise<{
      data: RestaurantRow[];
    }>,
  createRestaurant: (body: Record<string, unknown>) =>
    apiPost('/v1/meal-plans/restaurants', body) as Promise<{ data: RestaurantRow }>,
  updateRestaurant: (id: string, body: Record<string, unknown>) =>
    apiPatch(`/v1/meal-plans/restaurants/${id}`, body) as Promise<{ data: RestaurantRow }>,

  assignments: (params: Record<string, unknown>) =>
    apiGet('/v1/meal-plans/assignments', params) as Promise<{
      data: MealPlanAssignmentRow[];
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>,
  createAssignment: (body: Record<string, unknown>) =>
    apiPost('/v1/meal-plans/assignments', body) as Promise<{ data: MealPlanAssignmentRow }>,
  cancelAssignment: (id: string) =>
    apiPost(`/v1/meal-plans/assignments/${id}/cancel`, {}) as Promise<{
      data: MealPlanAssignmentRow;
    }>,

  covers: (propertyId: string, date: string) =>
    apiGet('/v1/meal-plans/covers', { propertyId, date }) as Promise<{
      data: CoversForecast;
    }>,

  postings: (params: Record<string, unknown>) =>
    apiGet('/v1/meal-plans/postings', params) as Promise<{
      data: MealPostingRow[];
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>,
  retryPosting: (id: string) =>
    apiPost(`/v1/meal-plans/postings/${id}/retry`, {}) as Promise<{ data: MealPostingRow }>,
  postNow: () =>
    apiPost('/v1/meal-plans/post-now', {}) as Promise<{
      data: { created: number; posted: number; failed: number; skipped: number };
    }>,
};
