/**
 * Example Producer Page - Form Builder
 * Demonstrates how to create and manage services using the API
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { producerService } from '../../../services/api/producer.service';
import { useApi } from '../../../shared/hooks';
import type { CreateServiceDto, FormField, FormSchema } from '../../../shared/types';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Plus, Save, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FormBuilderExample() {
  const navigate = useNavigate();
  const { loading, execute } = useApi();

  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [formFields, setFormFields] = useState<FormField[]>([]);

  // Add new form field
  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      name: '',
      label: '',
      required: false,
    };
    setFormFields([...formFields, newField]);
  };

  // Update field
  const updateField = (index: number, updates: Partial<FormField>) => {
    const updated = [...formFields];
    updated[index] = { ...updated[index]!, ...updates };
    setFormFields(updated);
  };

  // Remove field
  const removeField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  // Save service
  const handleSave = async () => {
    // Validation
    if (!serviceName || !serviceCategory) {
      toast.error('Please fill in service name and category');
      return;
    }

    if (formFields.length === 0) {
      toast.error('Please add at least one form field');
      return;
    }

    // Validate all fields have names and labels
    const invalidFields = formFields.filter(f => !f.name || !f.label);
    if (invalidFields.length > 0) {
      toast.error('All fields must have a name and label');
      return;
    }

    const formSchema: FormSchema = {
      title: serviceName,
      description: serviceDescription,
      fields: formFields,
    };

    const serviceData: CreateServiceDto = {
      name: serviceName,
      description: serviceDescription,
      category: serviceCategory,
      formSchema,
    };

    const result = await execute(() => producerService.createService(serviceData));

    if (result) {
      toast.success('Service created successfully!');
      navigate('/admin/services');
    } else {
      toast.error('Failed to create service');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Form Builder</h1>
        <p className="text-gray-600">Create a new service with dynamic form</p>
      </div>

      <div className="space-y-6">
        {/* Service Details */}
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="serviceName">Service Name *</Label>
              <Input
                id="serviceName"
                placeholder="e.g., Building Permit Application"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="serviceDescription">Description</Label>
              <Textarea
                id="serviceDescription"
                placeholder="Describe what this service is for..."
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="serviceCategory">Category *</Label>
              <Select value={serviceCategory} onValueChange={setServiceCategory}>
                <SelectTrigger id="serviceCategory">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Permits">Permits</SelectItem>
                  <SelectItem value="Licenses">Licenses</SelectItem>
                  <SelectItem value="Certificates">Certificates</SelectItem>
                  <SelectItem value="Registration">Registration</SelectItem>
                  <SelectItem value="Tax">Tax</SelectItem>
                  <SelectItem value="Benefits">Benefits</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Form Fields */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Form Fields</CardTitle>
            <Button onClick={addField} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Field
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {formFields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No fields added yet. Click "Add Field" to get started.
              </div>
            ) : (
              formFields.map((field, index) => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  index={index}
                  onUpdate={(updates) => updateField(index, updates)}
                  onRemove={() => removeField(index)}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => navigate('/admin/services')}>
            Cancel
          </Button>
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Service'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Field Editor Component
function FieldEditor({
  field,
  index,
  onUpdate,
  onRemove,
}: {
  field: FormField;
  index: number;
  onUpdate: (updates: Partial<FormField>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Field #{index + 1}</span>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Field Type</Label>
          <Select
            value={field.type}
            onValueChange={(type: any) => onUpdate({ type })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="tel">Phone</SelectItem>
              <SelectItem value="textarea">Text Area</SelectItem>
              <SelectItem value="select">Dropdown</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="file">File Upload</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Field Name (ID)</Label>
          <Input
            placeholder="e.g., applicantName"
            value={field.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
        </div>

        <div className="col-span-2">
          <Label className="text-xs">Field Label</Label>
          <Input
            placeholder="e.g., Applicant's Full Name"
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
          />
        </div>

        <div className="col-span-2">
          <Label className="text-xs">Placeholder</Label>
          <Input
            placeholder="Optional hint text"
            value={field.placeholder || ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`required_${field.id}`}
            checked={field.required || false}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor={`required_${field.id}`} className="text-xs">
            Required field
          </Label>
        </div>
      </div>
    </div>
  );
}
