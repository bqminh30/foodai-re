'use client';

import { useTranslations } from 'next-intl';
import { Textarea } from '@/components/ui/textarea';

interface SpecialRequirementsProps {
  specialRequirements: string;
  onSpecialRequirementsChange: (specialRequirements: string) => void;
}

export function SpecialRequirements({
  specialRequirements,
  onSpecialRequirementsChange
}: SpecialRequirementsProps) {
  const t = useTranslations();
  
  return (
    <div className="space-y-2">
      <h3 className="text-md font-medium">{t('food.settings.special_requirements.title')}</h3>
      <p className="text-sm text-muted-foreground">{t('food.settings.special_requirements.description')}</p>
      <div className="mt-2">
        <Textarea
          id="specialRequirements"
          placeholder={t('food.settings.special_requirements.placeholder')}
          value={specialRequirements}
          onChange={(e) => onSpecialRequirementsChange(e.target.value)}
          className="resize-none"
          rows={3}
        />
      </div>
    </div>
  );
}