
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface FeatureRequestModalProps {
  children: React.ReactNode;
}

const FeatureRequestModal = ({ children }: FeatureRequestModalProps) => {
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!request.trim()) {
      toast.error('Please enter your feature request');
      return;
    }

    if (request.length > 500) {
      toast.error('Feature request must be 500 characters or less');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call - in real app, this would send to Supabase function or email service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Thanks! We\'ll review your request.');
      setRequest('');
      setOpen(false);
    } catch (error) {
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Need a Specific Tool?</DialogTitle>
          <DialogDescription>
            Let us know what AI tool would help your workflow
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feature-request">Your Feature Request</Label>
            <Textarea
              id="feature-request"
              placeholder="Describe the AI tool or feature you'd like to see..."
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
            />
            <div className="text-sm text-muted-foreground text-right">
              {request.length}/500 characters
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !request.trim()}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {isSubmitting ? 'Submitting...' : 'Send Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureRequestModal;
