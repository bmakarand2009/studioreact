import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { 
  BookOpen, 
  Users, 
  Award, 
  Globe, 
  ArrowRight,
  CheckCircle,
  Star,
  Target
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-brand-50 dark:from-primary-900/20 dark:to-brand-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              About
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-brand-600">
                {' '}Wajooba LMS
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              We&apos;re on a mission to democratize education and make quality learning accessible to everyone, everywhere.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                At Wajooba LMS, we believe that education is the foundation of progress and innovation. 
                Our platform is designed to break down barriers to learning and create opportunities for 
                students, educators, and organizations worldwide.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                We&apos;re committed to providing cutting-edge technology that enhances the learning experience, 
                fosters collaboration, and empowers individuals to achieve their educational goals.
              </p>
              <Link to="/courses">
                <Button size="lg">
                  Explore Our Courses
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="bg-gradient-to-br from-primary-100 to-brand-100 dark:from-primary-900/30 dark:to-brand-900/30 rounded-2xl p-12 text-center">
              <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Empowering Learners
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Join thousands of learners who have transformed their careers and lives through our platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              These principles guide everything we do and shape our platform&apos;s development
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Excellence in Education',
                description: 'We maintain the highest standards of educational quality and continuously improve our content and delivery methods.'
              },
              {
                icon: Users,
                title: 'Community First',
                description: 'We believe in the power of collaborative learning and building strong educational communities.'
              },
              {
                icon: Award,
                title: 'Innovation',
                description: 'We constantly explore new technologies and methodologies to enhance the learning experience.'
              },
              {
                icon: Globe,
                title: 'Accessibility',
                description: 'We\'re committed to making quality education accessible to learners worldwide, regardless of location or background.'
              },
              {
                icon: CheckCircle,
                title: 'Integrity',
                description: 'We operate with transparency, honesty, and ethical practices in all our interactions.'
              },
              {
                icon: Star,
                title: 'Continuous Improvement',
                description: 'We\'re always learning, growing, and evolving to better serve our community.'
              }
            ].map((value, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-xl mb-6">
                  <value.icon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-r from-primary-600 to-brand-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '2020', label: 'Founded' },
              { number: '50K+', label: 'Active Students' },
              { number: '500+', label: 'Expert Instructors' },
              { number: '1000+', label: 'Courses Available' }
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-primary-100 text-lg">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Join Our Community?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Start your learning journey today and become part of our growing global community of learners and educators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="text-lg px-8 py-4">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="secondary" size="lg" className="text-lg px-8 py-4">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
