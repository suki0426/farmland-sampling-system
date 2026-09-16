<template>
  <StructureWizardSteps
    :value="value"
    :steps="steps"
    :max-step="maxStep"
    @input="$emit('input', $event)"
  />
</template>

<script>
import StructureWizardSteps from '@/components/documentStructure/StructureWizardSteps'
import { TEMPLATE_WIZARD_STEPS } from './constants'

export default {
  name: 'TemplateWizardSteps',
  components: {
    StructureWizardSteps
  },
  props: {
    value: { type: String, default: 'category' },
    steps: {
      type: Array,
      default: () => TEMPLATE_WIZARD_STEPS
    },
    maxStep: { type: String, default: 'category' }
  }
}
</script>
