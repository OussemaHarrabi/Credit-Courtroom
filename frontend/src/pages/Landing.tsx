import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Gavel, 
  ArrowRight, 
  Shield, 
  Scale, 
  FileSearch, 
  MessagesSquare, 
  CheckCircle2,
  Database,
  Brain,
  Users,
  Lock,
  Eye,
  Github,
  Twitter,
  Linkedin
} from 'lucide-react';
import { useRef } from 'react';

// Animated background gradient component
function AnimatedBackground() {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return (
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-white via-slate-50 to-slate-100" />
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-100"
        animate={{
          background: [
            'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
            'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
            'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Subtle animated orbs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-slate-200/30 blur-3xl"
        animate={{
          x: ['-10%', '10%', '-10%'],
          y: ['-10%', '5%', '-10%'],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ top: '10%', left: '5%' }}
      />
      <motion.div
        className="absolute w-80 h-80 rounded-full bg-slate-300/20 blur-3xl"
        animate={{
          x: ['10%', '-10%', '10%'],
          y: ['5%', '-5%', '5%'],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ bottom: '20%', right: '10%' }}
      />
    </div>
  );
}

// Scroll-triggered fade-in animation wrapper
function FadeInOnScroll({ 
  children, 
  delay = 0,
  className = '' 
}: { 
  children: React.ReactNode; 
  delay?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated card with hover effect
function AnimatedCard({ 
  children, 
  className = '',
  delay = 0
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return <Card className={className}>{children}</Card>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={{ 
        scale: 1.03,
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.1)',
        transition: { duration: 0.2 }
      }}
    >
      <Card className={`${className} transition-shadow duration-200`}>
        {children}
      </Card>
    </motion.div>
  );
}

export function Landing() {
  const prefersReducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -50]);

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Gavel className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">Credit Courtroom</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Dashboard
            </Link>
            <Link to="/cases/new">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="pt-32 pb-20 px-6 relative overflow-hidden">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          style={prefersReducedMotion ? {} : { opacity: heroOpacity, y: heroY }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-600 mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Now in Demo Mode
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Explainable credit decisions
            <br />
            <span className="text-slate-500">grounded in evidence.</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Credit Courtroom uses AI-powered adversarial debate to evaluate loan applications 
            with full transparency. Every decision is traceable, auditable, and fair.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Link to="/dashboard">
              <Button size="lg" className="gap-2">
                Open Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/cases/case_001">
              <Button size="lg" variant="outline" className="gap-2">
                View Demo Case
                <Eye className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeInOnScroll className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Our four-step pipeline transforms raw applicant data into transparent, 
              explainable credit decisions.
            </p>
          </FadeInOnScroll>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Encode',
                description: 'Transform applicant features into 128-dimensional embeddings using our trained neural network.',
                icon: Brain,
              },
              {
                step: '02',
                title: 'Retrieve',
                description: 'Query vector database for top-K similar historical cases with known outcomes.',
                icon: Database,
              },
              {
                step: '03',
                title: 'Debate',
                description: 'Risk and Advocate agents present arguments in a structured courtroom format.',
                icon: MessagesSquare,
              },
              {
                step: '04',
                title: 'Verdict',
                description: 'Judge agent synthesizes arguments into a final decision with full justification.',
                icon: Gavel,
              },
            ].map((item, index) => (
              <AnimatedCard key={index} delay={index * 0.1} className="relative border-slate-200">
                <CardContent className="p-6">
                  <span className="absolute -top-3 -left-2 w-8 h-8 bg-slate-900 text-white text-sm font-bold rounded-full flex items-center justify-center">
                    {item.step}
                  </span>
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-slate-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </CardContent>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeInOnScroll className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Built for Trust</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Enterprise-grade features designed for financial institutions that demand 
              transparency and accountability.
            </p>
          </FadeInOnScroll>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Full Audit Trail',
                description: 'Every action is logged with timestamps. Review complete decision history from application to verdict.',
                icon: FileSearch,
              },
              {
                title: 'Adversarial Fairness',
                description: 'Balanced debate between Risk and Advocate agents prevents one-sided bias in decision making.',
                icon: Scale,
              },
              {
                title: 'Evidence-Based',
                description: 'Decisions grounded in similar historical cases with similarity scores and outcome statistics.',
                icon: CheckCircle2,
              },
              {
                title: 'Secure & Compliant',
                description: 'Built with security-first architecture. PII handling, encryption, and access controls.',
                icon: Lock,
              },
              {
                title: 'Human-in-the-Loop',
                description: 'Analysts can review, override, and provide feedback on AI-generated decisions.',
                icon: Users,
              },
              {
                title: 'Explainable AI',
                description: 'No black boxes. Every decision includes detailed justification with cited evidence.',
                icon: Eye,
              },
            ].map((item, index) => (
              <FadeInOnScroll key={index} delay={index * 0.1}>
                <motion.div 
                  className="flex gap-4"
                  whileHover={prefersReducedMotion ? {} : { x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </div>
                </motion.div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Future Roadmap */}
      <section className="py-20 bg-slate-900 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeInOnScroll className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">On the Horizon</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Our roadmap includes powerful enhancements for fraud detection and policy compliance.
            </p>
          </FadeInOnScroll>

          <div className="grid md:grid-cols-2 gap-8">
            <FadeInOnScroll delay={0.1}>
              <motion.div
                whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-slate-800 border-slate-700 h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-purple-900/50 rounded-lg flex items-center justify-center mb-4">
                      <Shield className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Fraud Graph Integration</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Detect fraud rings using Neo4j graph analysis of transaction networks. 
                      Identify suspicious patterns across multiple applications.
                    </p>
                    <span className="inline-flex items-center gap-2 text-xs text-purple-400">
                      <span className="w-2 h-2 bg-purple-400 rounded-full" />
                      Phase 2 - Available Now
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            </FadeInOnScroll>

            <FadeInOnScroll delay={0.2}>
              <motion.div
                whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-slate-800 border-slate-700 h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-blue-900/50 rounded-lg flex items-center justify-center mb-4">
                      <Database className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Policy-Aware RAG</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Cite regulatory compliance rules directly in verdicts. Ensure every decision 
                      aligns with internal policies and external regulations.
                    </p>
                    <span className="inline-flex items-center gap-2 text-xs text-blue-400">
                      <span className="w-2 h-2 bg-blue-400 rounded-full" />
                      Phase 3 - Available Now
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <FadeInOnScroll>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Ready to transform your credit decisions?
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Start using Credit Courtroom today. Explore the demo, create test cases, 
              and experience transparent AI-powered credit evaluation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/dashboard">
                <Button size="lg" className="gap-2">
                  Open Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/cases/new">
                <Button size="lg" variant="outline" className="gap-2">
                  Create New Case
                  <Scale className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Gavel className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900">Credit Courtroom</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <Link to="/dashboard" className="hover:text-slate-900 transition-colors">Dashboard</Link>
              <Link to="/cases/new" className="hover:text-slate-900 transition-colors">New Case</Link>
              <Link to="/settings" className="hover:text-slate-900 transition-colors">Settings</Link>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100 text-center text-sm text-slate-500">
            © 2024 Credit Courtroom. Demo application for educational purposes.
          </div>
        </div>
      </footer>
    </div>
  );
}
