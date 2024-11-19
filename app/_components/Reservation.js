import DateSelector from '@/app/_components/DateSelector';
import ReservationForm from '@/app/_components/ReservationForm';
import LoginMessage from '@/app/_components/LoginMessage';
import { getBookedDatesByCabinId, getSettings } from '@/app/_lib/data-service';
import { auth } from '@/app/_lib/auth';

const Reservation = async ({ cabin }) => {
  const [bookedDates, settings] = await Promise.all([
    getBookedDatesByCabinId(cabin.id),
    getSettings(),
  ]);

  const session = await auth();

  return (
    <div
      className={`grid ${
        session?.user ? 'grid-cols-2' : 'grid-cols-1'
      } border border-primary-800 min-h-[400px]`}
    >
      <DateSelector
        cabin={cabin}
        bookedDates={bookedDates}
        settings={settings}
      />
      {session?.user ? (
        <ReservationForm cabin={cabin} user={session.user} />
      ) : (
        <LoginMessage />
      )}
    </div>
  );
};

export default Reservation;
