'use server';

import { auth, signIn, signOut } from '@/app/_lib/auth';
import { supabase } from '@/app/_lib/supabase';
import { revalidatePath } from 'next/cache';
import {
  getBookedDatesByCabinId,
  getBooking,
  getBookings,
} from './data-service';
import { redirect } from 'next/navigation';
import { isPast } from 'date-fns';
import { isAlreadyBooked } from './utils';

export async function updateGuest(formData) {
  const session = await auth();
  if (!session) throw new Error('You must be logged in');

  const nationalID = formData.get('nationalID');
  const [nationality, countryFlag] = formData.get('nationality').split('%');

  // check that national ID contains between 6-12 chars, it's alphanumeric
  if (!/^[a-zA-z0-9]{6,12}$/.test(nationalID)) {
    throw new Error('Please provide a valid national ID');
  }

  const updateData = { nationalID, nationality, countryFlag };

  const { data, error } = await supabase
    .from('guests')
    .update(updateData)
    .eq('id', session.user.guestId);

  if (error) {
    throw new Error('Guest could not be updated');
  }

  revalidatePath('/account/profile');
}

export async function createBooking(bookingData, formData) {
  const session = await auth();
  if (!session) throw new Error('You must be logged in');

  // validate with ZOD as a challenge
  const newBooking = {
    ...bookingData,
    guestId: session.user.guestId,
    numGuests: Number(formData.get('numGuests')),
    observations: formData.get('observations').slice(0, 1000),
    extrasPrice: 0,
    totalPrice: bookingData.cabinPrice,
    isPaid: false,
    hasBreakfast: false,
    status: 'unconfirmed',
  };

  // checks
  const bookedDates = getBookedDatesByCabinId(bookingData.cabinId);
  const range = { from: bookingData.startDate, to: bookingData.endDate };

  if (isAlreadyBooked(range, bookedDates))
    throw new Error('Invalid range of dates selected');

  // create booking
  const { error } = await supabase.from('bookings').insert([newBooking]);

  if (error) throw new Error('Booking could not be created');

  revalidatePath(`/cabins/${bookingData.cabinId}`);

  redirect('/cabins/thankyou');
}

export async function deleteBooking(bookingId) {
  // To test useOptimistic hook
  // await new Promise(res => setTimeout(res, 3000));
  // throw new Error('');

  const session = await auth();
  if (!session) throw new Error('You must be logged in');

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingIds = guestBookings.map(booking => booking.id);

  if (!guestBookingIds.includes(bookingId))
    throw new Error('You are not allowed to delete this booking');

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId);

  if (error) throw new Error('Booking could not be deleted');

  revalidatePath('/account/reservations');
}

export async function updateBooking(formData) {
  const session = await auth();
  if (!session) throw new Error('You must be logged in');

  // check if the booking is from the current logged in user
  // call the getBookings fn to receive all the bookings from this user
  const bookingId = Number(formData.get('bookingId'));
  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingIds = guestBookings.map(booking => booking.id);
  // check if the bookings Arr from this user includes the target booking
  // if not throw an error
  if (!guestBookingIds.includes(bookingId))
    throw new Error('You are not allowed to update this booking');

  // check they are not updating a past booking
  const booking = await getBooking(bookingId);
  if (isPast(new Date(booking.startDate)))
    throw new Error(`This booking is already past, and can't be updated`);

  // Get the form data
  const numGuests = formData.get('numGuests');
  const observations = formData.get('observations').slice(0, 1000);
  const updateData = { numGuests, observations };

  // update the booking/reservation
  const { error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId);

  if (error) {
    throw new Error('Booking could not be updated');
  }

  revalidatePath('/account/reservations');
  revalidatePath(`/account/reservations/edit/${bookingId}`);

  redirect('/account/reservations');
}

export async function signInAction() {
  await signIn('google', { redirectTo: '/account' });
}

export async function signOutAction() {
  await signOut({ redirectTo: '/' });
}
