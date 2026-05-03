import { Play, CheckCircle, Book, FileText, Bell, ChevronRight, Award, Star } from 'lucide-react';

export default function TutorialGuide() {
  const tutorials = [
    {
      title: 'Getting Started',
      lessons: [
        { name: 'Creating Your Account', duration: '3 min', completed: true },
        { name: 'Completing Your Profile', duration: '5 min', completed: true },
        { name: 'Exploring the Dashboard', duration: '4 min', completed: false },
      ]
    },
    {
      title: 'Applying for Services',
      lessons: [
        { name: 'Finding the Right Service', duration: '6 min', completed: false },
        { name: 'Filling Out Applications', duration: '8 min', completed: false },
        { name: 'Uploading Documents', duration: '5 min', completed: false },
        { name: 'Making Payments', duration: '4 min', completed: false },
      ]
    },
    {
      title: 'DigiLocker Integration',
      lessons: [
        { name: 'Linking Your DigiLocker', duration: '7 min', completed: false },
        { name: 'Using Stored Documents', duration: '4 min', completed: false },
        { name: 'Managing Consent', duration: '5 min', completed: false },
      ]
    },
    {
      title: 'Advanced Features',
      lessons: [
        { name: 'Tracking Application Status', duration: '3 min', completed: false },
        { name: 'Filing Grievances', duration: '6 min', completed: false },
        { name: 'Using Live Chat Support', duration: '4 min', completed: false },
        { name: 'Downloading Certificates', duration: '3 min', completed: false },
      ]
    },
  ];

  const progress = tutorials.reduce((acc, section) => {
    const completed = section.lessons.filter(l => l.completed).length;
    return acc + completed;
  }, 0);

  const total = tutorials.reduce((acc, section) => acc + section.lessons.length, 0);
  const progressPercent = Math.round((progress / total) * 100);

  return (
    <div className="min-h-full bg-muted/30 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tutorial & Learning Center</h1>
          <p className="text-muted-foreground">Learn how to make the most of ServiceFormAI OS</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tutorials */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Banner */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center">
                  <Award className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Your Learning Progress</h3>
                  <p className="text-sm text-muted-foreground">{progress} of {total} lessons completed</p>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-3 mb-2">
                <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <p className="text-sm text-primary font-medium">{progressPercent}% Complete</p>
            </div>

            {/* Tutorial Sections */}
            {tutorials.map((section, sectionIdx) => (
              <div key={sectionIdx} className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">{section.title}</h2>
                <div className="space-y-2">
                  {section.lessons.map((lesson, lessonIdx) => (
                    <button
                      key={lessonIdx}
                      className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          lesson.completed ? 'bg-success/10' : 'bg-muted'
                        }`}>
                          {lesson.completed ? (
                            <CheckCircle className="w-5 h-5 text-success" />
                          ) : (
                            <Play className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className={`font-medium ${lesson.completed ? 'text-muted-foreground line-through' : ''}`}>
                            {lesson.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{lesson.duration}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - Quick Links */}
          <div className="space-y-6">
            {/* Featured Video */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <button className="w-16 h-16 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors">
                  <Play className="w-8 h-8 text-primary-foreground ml-1" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-2">Platform Overview</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  A complete walkthrough of ServiceFormAI OS features
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>12:34</span>
                  <span>•</span>
                  <span>Updated Apr 2026</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                {[
                  { label: 'User Guide PDF', icon: Book },
                  { label: 'Video Library', icon: Play },
                  { label: 'FAQs', icon: FileText },
                  { label: 'Contact Support', icon: Bell },
                ].map((link, idx) => {
                  const Icon = link.icon;
                  return (
                    <button key={idx} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{link.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Achievement */}
            <div className="bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Star className="w-6 h-6 text-warning fill-warning" />
                <h3 className="font-semibold">Keep Learning!</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Complete all tutorials to become a ServiceFormAI OS expert and earn badges!
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((badge) => (
                  <div
                    key={badge}
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      badge <= 2 ? 'bg-warning/20' : 'bg-muted'
                    }`}
                  >
                    <Award className={`w-5 h-5 ${badge <= 2 ? 'text-warning' : 'text-muted-foreground'}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
