'use client';
import { useEffect, useOptimistic, useRef, useState } from 'react';
import ReservationCard from './ReservationCard';
import { deleteBooking } from '../_lib/actions';

export default function ReservationList({ bookings }) {
  const [optimisticBookings, optimisticDelete] = useOptimistic(
    bookings,
    (curBookings, bookingId) =>
      curBookings.filter(booking => booking.id !== bookingId)
  );

  const [errorPopup, setErrorPopup] = useState(null);
  const dialogRef = useRef(null);

  async function handleDelete(bookingId) {
    optimisticDelete(bookingId);

    // Adding a try/catch to display any feedback to user if this fails, since error boundary doesn't seems to affect useOptimistic operations
    try {
      await deleteBooking(bookingId);
    } catch {
      setErrorPopup('Reservation could not be deleted');
      dialogRef.current.show();
    }
  }

  useEffect(() => {
    // remove any pop up error and clean up the timer
    if (errorPopup) {
      const timer = setTimeout(() => {
        dialogRef.current.close();
        setErrorPopup(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [errorPopup]);

  return (
    <>
      <ul className='space-y-6'>
        {optimisticBookings.map(booking => (
          <ReservationCard
            key={booking.id}
            booking={booking}
            onDelete={handleDelete}
          />
        ))}
      </ul>
      <dialog
        ref={dialogRef}
        className='open:bottom-6 open:bg-red-700 open:text-primary-200 px-6 py-4 font-bold text-xl rounded-sm'
      >
        {errorPopup}
      </dialog>
    </>
  );
}
