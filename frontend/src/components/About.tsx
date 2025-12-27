import React from 'react';
import { X, Mail, Heart } from 'lucide-react';

interface AboutProps {
  isOpen: boolean;
  onClose: () => void;
}

const About: React.FC<AboutProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">About QAStarter</h2>
          <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full"></div>
        </div>
        
        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <p>
            QAStarter lets QA engineers instantly generate best-practice test automation frameworks.
            Inspired by Spring Initializr, built by and for the QA community.
          </p>
          
          <p>
            Our mission is to eliminate the time-consuming setup process and let you focus on what matters most: 
            creating robust, reliable test automation.
          </p>
          
          <div className="flex items-center space-x-2 pt-4">
            <Heart className="text-red-500" size={16} />
            <span className="text-sm">Built with love for QA Engineers</span>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Mail size={16} />
            <span>For feedback, reach out at</span>
            <a 
              href="mailto:info@qatonic.com" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              info@qatonic.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;