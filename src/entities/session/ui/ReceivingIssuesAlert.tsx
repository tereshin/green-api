import { Alert } from '@heroui/react'

import { getReceivingIssueMessage } from '@/entities/session/lib/receiving-issue-message'
import type { ReceivingIssue } from '@/entities/session/model/types'

type ReceivingIssuesAlertProps = {
  issues: ReceivingIssue[]
}

export function ReceivingIssuesAlert({ issues }: ReceivingIssuesAlertProps) {
  if (issues.length === 0) {
    return null
  }

  return (
    <Alert status="warning" className="shadow-none">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Получение сообщений может не работать</Alert.Title>
        {issues.map((issue) => (
          <Alert.Description key={issue}>{getReceivingIssueMessage(issue)}</Alert.Description>
        ))}
      </Alert.Content>
    </Alert>
  )
}
