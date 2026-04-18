import React, { useEffect, useState } from 'react';
import { updatePayment } from '../api/endpoints';
import api from '../api/axios';

const Pricing = () => {
  const [minDonation, setMinDonation] = useState<string>('');
  const [minSubscription, setMinSubscription] = useState<string>('');
  const [loading , setLoading] = useState<boolean>(false);
  const getPaymentDetails  = async () => {
    const paymentLimits =  await api.get('/paymentLimit')
    console.log(paymentLimits?.data);
    setMinDonation(paymentLimits?.data?.doantion || '');
    setMinSubscription(paymentLimits?.data?.subcribe
 || '');
  }
  const handleUpdate = async () => {
    setLoading(true);
    const payload = {
      doantion: Number(minDonation),
      subcribe: Number(minSubscription)
    };
    const res:any = updatePayment(payload);
    getPaymentDetails();
      setLoading(false);
  };
  useEffect(()=>{
    getPaymentDetails();
  },[])

  return (
    <div className="p-8 min-h-screen">
      
      <div className="">
        {/* Minimum Donation Container */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#EADDCA]">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-[#F5E6D3] rounded-lg mr-3">
              <svg className="w-6 h-6 text-[#8B5E3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="Vector icon logic here..." />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#4A3728]">Minimum Subscription Amount</h3>
          </div>
          <p className="text-sm text-gray-500 mb-2">Minimum Donation Amount</p>
          <div className="relative mb-4">
            <span className="absolute left-3 top-2 text-gray-400">$</span>
           <input
  type="text"
  value={minSubscription}
  onChange={(e) => {
    const value:any = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setMinSubscription(value);
    }
  }}
  className="w-full pl-8 pr-4 py-2 border border-[#EADDCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] bg-white"
  placeholder="0.00"
/>
          </div>
          <p className="text-sm text-gray-500 mb-2">Minimum Subscription Amount</p>
           <div className="relative mb-4">
            <span className="absolute left-3 top-2 text-gray-400">$</span>
            <input 
              type="text"
              value={minDonation}
              onChange={(e) => {
                const value:any = e.target.value;

                // Allow only digits and optional decimal
                if (/^\d*\.?\d*$/.test(value)) {
                  setMinDonation(value);
                }
              }}
              className="w-full pl-8 pr-4 py-2 border border-[#EADDCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] bg-white"
              placeholder="10,000.00"
            />
          </div>
          <button 
          disabled={loading}
            onClick={() => handleUpdate()}
            className={`w-full bg-[#8B5E3C] hover:bg-[#6F4A2F] text-white py-2 rounded-lg transition-colors font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Update
          </button>
        </div>

      </div>
    </div>
  );
};

export default Pricing;