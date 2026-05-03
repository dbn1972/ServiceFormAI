import { Calendar as CalendarIcon, Clock, MapPin, CheckCircle, ChevronLeft, ChevronRight, Building, AlertCircle, Info } from 'lucide-react';
import { useState } from 'react';

export default function AppointmentBooking() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedOffice, setSelectedOffice] = useState('');

  const offices = [
    { id: '1', name: 'Regional Transport Office - Indiranagar', address: 'HAL 2nd Stage, Bangalore - 560038', distance: '2.3 km' },
    { id: '2', name: 'Regional Transport Office - Koramangala', address: 'Hosur Road, Bangalore - 560095', distance: '4.7 km' },
    { id: '3', name: 'Regional Transport Office - Jayanagar', address: '9th Block, Bangalore - 560069', distance: '6.2 km' },
  ];

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM'
  ];

  const getDaysInMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth();
  const today = new Date();

  return (
    <div className="min-h-full bg-muted/30 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Book an Appointment</h1>
          <p className="text-muted-foreground">Schedule an in-person visit to complete your service application</p>
        </div>

        {/* Info Banner */}
        <div className="bg-info/10 border border-info/20 rounded-xl p-4 mb-8 flex items-start gap-3">
          <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Appointment Required</p>
            <p className="text-sm text-muted-foreground">
              For Driving License Renewal (APP-2026-8901), you need to visit the RTO for biometric verification and photo capture.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Select Office */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <h2 className="text-lg font-semibold">Select Office Location</h2>
              </div>

              <div className="space-y-3">
                {offices.map((office) => (
                  <button
                    key={office.id}
                    onClick={() => setSelectedOffice(office.id)}
                    className={`w-full p-4 border-2 rounded-xl text-left transition-colors ${
                      selectedOffice === office.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{office.name}</h3>
                          <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p>{office.address}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">📍 {office.distance} away</span>
                        </div>
                      </div>
                      {selectedOffice === office.id && (
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Select Date */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <h2 className="text-lg font-semibold">Select Date</h2>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">
                  {new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Calendar */}
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const date = new Date(year, month, day);
                  const isPast = date < today;
                  const isToday = date.toDateString() === today.toDateString();
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  const isWeekend = date.getDay() === 0; // Sunday
                  
                  return (
                    <button
                      key={day}
                      onClick={() => !isPast && !isWeekend && setSelectedDate(date)}
                      disabled={isPast || isWeekend}
                      className={`aspect-square p-2 rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : isToday
                          ? 'border-2 border-primary text-primary'
                          : isPast || isWeekend
                          ? 'text-muted-foreground/50 cursor-not-allowed'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                * Offices are closed on Sundays and public holidays
              </p>
            </div>

            {/* Step 3: Select Time */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <h2 className="text-lg font-semibold">Select Time Slot</h2>
              </div>

              {!selectedDate ? (
                <div className="py-8 text-center">
                  <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Please select a date first</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {timeSlots.map((time, index) => {
                    const isAvailable = index % 3 !== 0; // Mock availability
                    const isSelected = selectedTime === time;
                    
                    return (
                      <button
                        key={time}
                        onClick={() => isAvailable && setSelectedTime(time)}
                        disabled={!isAvailable}
                        className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : isAvailable
                            ? 'border border-border hover:bg-muted'
                            : 'border border-border bg-muted/50 text-muted-foreground/50 cursor-not-allowed'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <h2 className="text-lg font-semibold">Confirm Contact Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    defaultValue="Ananya Sharma"
                    className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mobile Number</label>
                  <input
                    type="tel"
                    defaultValue="+91 98765 43210"
                    className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    defaultValue="ananya.sharma@email.com"
                    className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-card border border-border rounded-xl p-6 sticky top-6">
              <h3 className="font-semibold mb-4">Appointment Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Office</p>
                    <p className="text-sm font-medium">
                      {selectedOffice ? offices.find(o => o.id === selectedOffice)?.name : 'Not selected'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date</p>
                    <p className="text-sm font-medium">
                      {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Not selected'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Time</p>
                    <p className="text-sm font-medium">{selectedTime || 'Not selected'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Service</span>
                  <span className="text-sm font-medium">DL Renewal</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Appointment Fee</span>
                  <span className="text-sm font-medium">Free</span>
                </div>
              </div>

              <button
                disabled={!selectedOffice || !selectedDate || !selectedTime}
                className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Confirm Appointment
              </button>
            </div>

            {/* Important Notes */}
            <div className="bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-warning" />
                <h3 className="font-semibold">Important Notes</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <span>Bring original documents and one photocopy</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <span>Arrive 10 minutes before appointment</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <span>Appointment confirmation sent via SMS/Email</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <span>Rescheduling allowed up to 24 hours before</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
