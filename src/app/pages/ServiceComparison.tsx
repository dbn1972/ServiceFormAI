import { CheckCircle, X, Clock, IndianRupee, FileText, Users, Plus, Trash2 } from 'lucide-react';

export default function ServiceComparison() {
  const services = [
    {
      name: 'State Merit Scholarship',
      dept: 'Education Department',
      eligible: true,
      fee: 'Free',
      time: '7-10 days',
      docs: 5,
      eligibility: {
        income: '< ₹2.5L',
        age: '16-25',
        marks: '60%',
        location: 'Maharashtra',
      },
      benefits: ['₹10,000/year', 'For 4 years', 'Direct bank transfer'],
    },
    {
      name: 'Central Sector Scholarship',
      dept: 'Ministry of Education',
      eligible: true,
      fee: 'Free',
      time: '10-15 days',
      docs: 6,
      eligibility: {
        income: '< ₹3L',
        age: '18-30',
        marks: '50%',
        location: 'India',
      },
      benefits: ['₹12,000/year', 'For 3 years', 'Renewable'],
    },
    {
      name: 'Post Matric SC/ST Scholarship',
      dept: 'Social Welfare',
      eligible: false,
      fee: 'Free',
      time: '15-20 days',
      docs: 7,
      eligibility: {
        income: '< ₹2L',
        age: '16-35',
        marks: '50%',
        location: 'Maharashtra',
      },
      benefits: ['₹8,500/year', 'SC/ST only', 'Tuition + maintenance'],
    },
  ];

  return (
    <div className="min-h-full bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-4">Compare Services</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Compare multiple services side-by-side to find the best match for your needs
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Controls */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">
              <Plus className="w-5 h-5" />
              Add Service
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-medium hover:bg-accent">
              <Trash2 className="w-5 h-5" />
              Clear All
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Comparing <strong>{services.length} services</strong>
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-6 bg-muted w-64">
                    <p className="font-semibold">Feature</p>
                  </th>
                  {services.map((service, index) => (
                    <th key={index} className="p-6 text-left min-w-64">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold mb-1">{service.name}</h3>
                          <p className="text-xs text-muted-foreground font-normal">{service.dept}</p>
                        </div>
                        <button className="p-1 hover:bg-destructive/10 rounded">
                          <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                      {service.eligible ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-success/10 text-success rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          You're Eligible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                          Not Eligible
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Processing Time */}
                <tr className="border-b border-border">
                  <td className="p-6 bg-muted font-medium flex items-center gap-2">
                    <Clock className="w-5 h-5 text-info" />
                    Processing Time
                  </td>
                  {services.map((service, index) => (
                    <td key={index} className="p-6">
                      <span className="font-medium">{service.time}</span>
                    </td>
                  ))}
                </tr>

                {/* Service Fee */}
                <tr className="border-b border-border">
                  <td className="p-6 bg-muted font-medium flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-success" />
                    Service Fee
                  </td>
                  {services.map((service, index) => (
                    <td key={index} className="p-6">
                      <span className="font-medium text-success">{service.fee}</span>
                    </td>
                  ))}
                </tr>

                {/* Documents Required */}
                <tr className="border-b border-border">
                  <td className="p-6 bg-muted font-medium flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Documents Required
                  </td>
                  {services.map((service, index) => (
                    <td key={index} className="p-6">
                      <span className="font-medium">{service.docs} documents</span>
                    </td>
                  ))}
                </tr>

                {/* Section: Eligibility Criteria */}
                <tr className="bg-muted/50">
                  <td colSpan={services.length + 1} className="p-4 font-semibold text-sm">
                    Eligibility Criteria
                  </td>
                </tr>

                {/* Income Limit */}
                <tr className="border-b border-border">
                  <td className="p-6 bg-muted font-medium">Annual Family Income</td>
                  {services.map((service, index) => (
                    <td key={index} className="p-6">
                      {service.eligibility.income}
                    </td>
                  ))}
                </tr>

                {/* Age Range */}
                <tr className="border-b border-border">
                  <td className="p-6 bg-muted font-medium">Age Range</td>
                  {services.map((service, index) => (
                    <td key={index} className="p-6">
                      {service.eligibility.age} years
                    </td>
                  ))}
                </tr>

                {/* Minimum Marks */}
                <tr className="border-b border-border">
                  <td className="p-6 bg-muted font-medium">Minimum Marks</td>
                  {services.map((service, index) => (
                    <td key={index} className="p-6">
                      {service.eligibility.marks}
                    </td>
                  ))}
                </tr>

                {/* Coverage */}
                <tr className="border-b border-border">
                  <td className="p-6 bg-muted font-medium">Geographic Coverage</td>
                  {services.map((service, index) => (
                    <td key={index} className="p-6">
                      {service.eligibility.location}
                    </td>
                  ))}
                </tr>

                {/* Section: Benefits */}
                <tr className="bg-muted/50">
                  <td colSpan={services.length + 1} className="p-4 font-semibold text-sm">
                    Benefits & Features
                  </td>
                </tr>

                {/* Benefits List */}
                <tr>
                  <td className="p-6 bg-muted font-medium">Key Benefits</td>
                  {services.map((service, index) => (
                    <td key={index} className="p-6">
                      <ul className="space-y-2">
                        {service.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          {services.map((service, index) => (
            <div key={index} className="flex-1">
              <button
                disabled={!service.eligible}
                className={`w-full py-3 rounded-lg font-medium ${
                  service.eligible
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {service.eligible ? 'Apply Now' : 'Not Eligible'}
              </button>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-info/10 border border-info/20 rounded-xl p-6">
          <div className="flex gap-3">
            <Users className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-2">Not sure which service is right for you?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Our eligibility checker can help you find all services you qualify for based on your profile.
                You can also chat with our support team for personalized recommendations.
              </p>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-info text-info-foreground rounded-lg text-sm font-medium hover:bg-info/90">
                  Check Eligibility
                </button>
                <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
