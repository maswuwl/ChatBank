
import React, { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number; // السرعة الأساسية
  onComplete?: () => void;
  onUpdate?: () => void;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ text, speed, onComplete, onUpdate }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // حساب السرعة الديناميكية: النص الطويل يظهر بشكل أسرع
  const dynamicSpeed = speed || (text.length > 500 ? 1 : (text.length > 100 ? 2 : 5));

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        // كتابة الحرف التالي
        const nextChar = text[currentIndex];
        setDisplayedText(prev => prev + nextChar);
        setCurrentIndex(prev => prev + 1);
        
        // إبلاغ الواجهة بحدوث تحديث (للتمرير التلقائي)
        if (onUpdate) onUpdate();
      }, dynamicSpeed);

      return () => clearTimeout(timeout);
    } else if (onComplete && text.length > 0) {
      onComplete();
    }
  }, [currentIndex, text, dynamicSpeed, onComplete, onUpdate]);

  // تصفير عند استلام نص جديد تماماً (بدء رد جديد)
  useEffect(() => {
    if (text.length > 0 && !text.startsWith(displayedText)) {
      setDisplayedText('');
      setCurrentIndex(0);
    }
  }, [text]);

  return (
    <div className="prose prose-invert max-w-none">
      <div className="text-[14px] md:text-[16px] leading-relaxed whitespace-pre-wrap text-gray-200 font-medium selection:bg-[#d4af37]/40 tracking-wide">
        {displayedText}
        {currentIndex < text.length && (
          <span className="inline-block w-1.5 h-4 bg-[#d4af37] ml-1 align-middle animate-pulse shadow-[0_0_10px_#d4af37]" />
        )}
      </div>
    </div>
  );
};

export default TypewriterText;
