import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import axios from 'axios';
import { X, Upload, Camera, Plus, Trash2 } from 'lucide-react';

const ExpenseForm = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm({
    defaultValues: {
      items: [{ name: '', amount: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const categories = [
    'Food',
    'Travel',
    'Office Supplies',
    'Transportation',
    'Accommodation',
    'Entertainment',
    'Other'
  ];

  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY'];

  // Watch items to calculate total
  const watchItems = watch('items');
  const calculateTotal = () => {
    return watchItems?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toFixed(2);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const totalAmount = parseFloat(calculateTotal());
      
      await axios.post('/expenses', {
        amount: totalAmount,
        currency: data.currency,
        category: data.category,
        description: data.description,
        expenseDate: data.expenseDate,
        receiptUrl: data.receiptUrl,
        merchant: data.merchant,
        items: data.items.filter(item => item.name && item.amount)
      });
      
      toast.success('Expense submitted successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit expense');
    }
    setLoading(false);
  };

  const handleReceiptUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await axios.post('/ocr/process-receipt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const { data: extractedData } = response.data;
      
      // Auto-fill form with extracted data
      setValue('currency', extractedData.currency);
      setValue('category', extractedData.category);
      setValue('description', extractedData.description);
      setValue('expenseDate', extractedData.date);
      setValue('merchant', extractedData.merchant);
      
      // Set line items
      if (extractedData.items && extractedData.items.length > 0) {
        setValue('items', extractedData.items);
      }
      
      toast.success('Receipt processed successfully!');
    } catch (error) {
      toast.error('Failed to process receipt. Please fill manually.');
    }
    setOcrLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border max-w-4xl shadow-lg rounded-md bg-white mb-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Submit New Expense</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt (Optional - Auto-fill with OCR)
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {ocrLoading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> receipt
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  disabled={ocrLoading}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Currency *
              </label>
              <select
                {...register('currency', { required: 'Currency is required' })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select</option>
                {currencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
              {errors.currency && (
                <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Expense Date *
              </label>
              <input
                {...register('expenseDate', { required: 'Date is required' })}
                type="date"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.expenseDate && (
                <p className="mt-1 text-sm text-red-600">{errors.expenseDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Merchant/Vendor
              </label>
              <input
                {...register('merchant')}
                type="text"
                placeholder="e.g., Restaurant name"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter expense description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Line Items Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Expense Line Items *
              </label>
              <button
                type="button"
                onClick={() => append({ name: '', amount: '' })}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-2">
                <div className="col-span-7">Item Description</div>
                <div className="col-span-4">Amount</div>
                <div className="col-span-1"></div>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2">
                  <div className="col-span-7">
                    <input
                      {...register(`items.${index}.name`, { required: 'Item name is required' })}
                      type="text"
                      placeholder="e.g., Lunch, Taxi fare"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      {...register(`items.${index}.amount`, { 
                        required: 'Amount is required',
                        min: { value: 0.01, message: 'Must be greater than 0' }
                      })}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="col-span-1 flex items-center">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Amount Display */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                <span className="text-lg font-bold text-gray-900">
                  {watch('currency') || 'INR'} {calculateTotal()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;