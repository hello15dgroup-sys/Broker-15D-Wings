import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { missionApi } from '../api';
import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { calculateMissionPricing } from '../lib/pricing';
import { supabase } from '../lib/supabase';

const bookingSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(5, 'Phone number is required'),
  departure: z.string().min(2, 'Departure is required'),
  destination: z.string().min(2, 'Destination is required'),
  passengers: z.number().min(1).max(30),
  aircraftClass: z.enum(['LIGHT', 'MIDSIZE', 'HEAVY', 'REGIONAL']),
  executionDate: z.string(),
});

export default function BookingForm() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      passengers: 1,
      aircraftClass: 'LIGHT',
    }
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const pricing = calculateMissionPricing([
        { from: data.departure, to: data.destination }
      ], data.aircraftClass, data.passengers);
      
      let lower = pricing.lower;
      let upper = pricing.upper;

      const missionId = `15D-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const { error } = await supabase.from('missions').insert({
        id: missionId,
        client_name: data.fullName,
        client_email: data.email,
        client_phone: data.phone,
        estimated_lower: lower,
        estimated_upper: upper,
        execution_timestamp: new Date(data.executionDate).getTime(),
        status: 'INTAKE_SUBMITTED',
        aircraft_class: data.aircraftClass,
        legs: [{
           from: data.departure,
           to: data.destination,
           date: data.executionDate,
           pax: data.passengers
        }],
        outstanding_balance: 0 // Reset entirely, outstanding balance is handled by ICC verified pricing
      });

      if (error) {
         console.error('Supabase error:', error);
         alert("Failed to submit booking request. " + error.message);
         return;
      }
      
      // Navigate to portal with the Mission ID
      navigate(`/portal?missionId=${missionId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 text-nearblack dark:text-offwhite">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="ui-sync text-fbblue block">FULL NAME</label>
          <input 
            {...register('fullName')}
            className="w-full bg-white/[0.02] border-b border-gray-300 dark:border-white/20 py-4 outline-none focus:border-fbblue transition-all"
            placeholder="Executive Principal Name"
          />
          {errors.fullName && <p className="text-fbblue text-[10px] mt-1 italic">{errors.fullName.message as string}</p>}
        </div>
        
        <div className="space-y-2">
          <label className="ui-sync text-fbblue block">EMAIL ADDRESS</label>
          <input 
            {...register('email')}
            className="w-full bg-white/[0.02] border-b border-gray-300 dark:border-white/20 py-4 outline-none focus:border-fbblue transition-all"
            placeholder="principal@execution.com"
          />
          {errors.email && <p className="text-fbblue text-[10px] mt-1 italic">{errors.email.message as string}</p>}
        </div>

        <div className="space-y-2">
          <label className="ui-sync text-fbblue block">PHONE NUMBER</label>
          <input 
            {...register('phone')}
            className="w-full bg-white/[0.02] border-b border-gray-300 dark:border-white/20 py-4 outline-none focus:border-fbblue transition-all"
            placeholder="+1 (555) 000-0000"
          />
          {errors.phone && <p className="text-fbblue text-[10px] mt-1 italic">{errors.phone.message as string}</p>}
        </div>

        <div className="space-y-2">
          <label className="ui-sync text-fbblue block">DEPARTURE</label>

          <input 
            {...register('departure')}
            className="w-full bg-white/[0.02] border-b border-gray-300 dark:border-white/20 py-4 outline-none focus:border-fbblue transition-all"
            placeholder="Airport or City"
          />
          {errors.departure && <p className="text-fbblue text-[10px] mt-1 italic">{errors.departure.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="ui-sync text-fbblue block">DESTINATION</label>
          <input 
            {...register('destination')}
            className="w-full bg-white/[0.02] border-b border-gray-300 dark:border-white/20 py-4 outline-none focus:border-fbblue transition-all"
            placeholder="Airport or City"
          />
          {errors.destination && <p className="text-fbblue text-[10px] mt-1 italic">{errors.destination.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="ui-sync text-fbblue block">PASSENGERS</label>
          <input 
            type="number"
            {...register('passengers', { valueAsNumber: true })}
            className="w-full bg-white/[0.02] border-b border-gray-300 dark:border-white/20 py-4 outline-none focus:border-fbblue transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="ui-sync text-fbblue block">AIRCRAFT CLASS</label>
          <select 
            {...register('aircraftClass')}
            className="w-full bg-white/[0.02] border-b border-gray-300 dark:border-white/20 py-4 outline-none focus:border-fbblue appearance-none transition-all"
          >
            <option value="LIGHT">LIGHT JET</option>
            <option value="MIDSIZE">MIDSIZE JET</option>
            <option value="HEAVY">HEAVY JET</option>
            <option value="REGIONAL">REGIONAL JET</option>
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="ui-sync text-fbblue block">EXECUTION DATE</label>
          <div className="custom-datepicker-wrapper">
          <Controller
            control={control}
            name="executionDate"
            render={({ field }) => (
              <DatePicker
                selected={field.value ? new Date(field.value) : null}
                onChange={(date) => field.onChange(date ? date.toISOString() : '')}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                className="w-full bg-transparent border-b border-gray-300 dark:border-white/20 py-4 outline-none focus:border-fbblue transition-all"
                placeholderText="Select date and time"
                wrapperClassName="w-full"
              />
            )}
          />
          </div>
        </div>
      </div>

      <motion.button 
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-nearblack dark:bg-fbblue text-white py-6 rounded-2xl ui-sync tracking-[0.5em] shadow-2xl relative overflow-hidden"
      >
        {loading ? "CALCULATING FEASIBILITY..." : "TRIGGER MISSION ANALYSIS"}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 animate-pulse" />
      </motion.button>
    </form>
  );
}
