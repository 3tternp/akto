import React from 'react'
import {
    LegacyCard,
    ResourceList,
    Avatar,
    ResourceItem,
    Text,
    Badge,
  } from '@shopify/polaris';
import {useState} from 'react';
import '../settings.css'
import LayoutWithTabs from '../../../components/layouts/LayoutWithTabs';
import { useNavigate} from 'react-router-dom'
import PageWithMultipleCards from '../../../components/layouts/PageWithMultipleCards';
import func from "@/util/func"

function Integrations() {

    const [sortValue, setSortValue] = useState('DATE_MODIFIED_DESC');
    const navigate = useNavigate()

    let burpSuiteObj = {
        id: 'burp',
        name:'Burp Suite',
        source: '/public/burp_logo.svg'
    }
    let postmanObj={
        id: 'postman',
        name:'Postman',
        source: '/public/postman_logo.svg'
    }
    let aktoApiObj={
        id: 'akto_apis',
        name:'Akto API',
        source: '/public/aktoApis_logo.svg'
    }
    let ciCdObj={
        id: 'ci-cd',
        name:'CI/CD',
        source: '/public/ciCd_logo.svg'
    }
    let aktoGptObj={
        id: 'akto_gpt',
        name:'Akto GPT',
        source: '/public/gpt_logo.svg'
    }
    let slackObj={
        id: 'slack',
        name:'Slack',   
        source: '/public/slack_logo.svg'
    }
    let webhooksObj={
        id: 'webhooks',
        name:'Webhooks',
        source: '/public/webhooks_logo.svg'
    }
    let teamsWebhooksObj={
      id: 'teamsWebhooks',
      name:'Microsoft Teams Webhooks',
      source: '/public/ms_teams.svg'
  }
    let githubSsoObj={
      id: 'github_sso',
      name:'Github SSO',
      source: '/public/github_icon.svg'
    }
    let jiraObj={
      id: 'jira',
      name:'Jira',
      source: '/public/logo_jira.svg'
    }

    let oktaSsoObj={
      id: 'okta_sso',
      name: 'Okta SSO',
      source: '/public/okta_logo.svg'
    }
    let azureAdSsoObj={
      id: 'azure_sso',
      name: 'Azure AD SSO',
      source: '/public/azure_logo.svg'
    }
    let githubAppObj = {
      id: 'github_app',
      name: 'Github App',
      source: '/public/github_icon.svg'
    }

    let googleWorkSpaceObj={
      id: 'google_workspace_sso',
      name: 'Google Workspace SSO',
      source: '/public/gcp.svg'
    }

    let ssoItems = [githubSsoObj, oktaSsoObj, azureAdSsoObj, googleWorkSpaceObj]
    const [currItems , setCurrentItems] = useState(getTabItems('all'))
    const tabs = [
        {
            id: 'all',
            content: <span>All <Badge status='new'>{getTabItems('all').length}</Badge></span>,
            component: <TabsList />
        },
        {
            id: 'traffic',
            content: <span>Traffic Source <Badge status='new'>{getTabItems('traffic').length}</Badge></span>,
            component: <TabsList />
        },
        {
            id: 'reporting',
            content: <span>Reporting <Badge status='new'>{getTabItems('reporting').length}</Badge></span>,
            component: <TabsList />
        },
        {
            id: 'ai',
            content: <span>AI <Badge status='new'>{getTabItems('ai').length}</Badge></span>,
            component: <TabsList />
        },
        {
            id: 'alerts',
            content: <span>Alerts <Badge status='new'>{getTabItems('alerts').length}</Badge></span>,
            component: <TabsList />
        },
        {
          id: 'sso',
          content: <span>SSO <Badge status='new'>{getTabItems('sso').length}</Badge></span>,
          component: <TabsList />
        },
        {
            id: 'automation',
            content: <span>Automation <Badge status='new'>{getTabItems('automation').length}</Badge></span>,
            component: <TabsList />
        }
    ]

  function getTabItems(tabId) {
    const emptyItem = [];
    const trafficItems = [burpSuiteObj, postmanObj];
    const reportingItems = [githubAppObj];
    const aiItems = [aktoGptObj];
    const alertsItems = [slackObj, webhooksObj, teamsWebhooksObj];
    const automationItems = [aktoApiObj, ciCdObj, jiraObj];
    switch (tabId) {
      case 'traffic':
        return trafficItems;
      case 'reporting':
        if (!func.checkOnPrem()) {
          return emptyItem;
        }
        return reportingItems;
      case 'ai':
        return aiItems;
      case 'sso':
        if (func.checkLocal()) {
          return emptyItem;
        }
        return ssoItems;
      case 'alerts':
        if (func.checkLocal()) {
          return emptyItem;
        }
        return alertsItems;
      case 'automation':
        if (func.checkLocal()) {
          return emptyItem;
        }
        return automationItems;
      default:
        let allItems = [...trafficItems, ...aiItems]
        if (!func.checkLocal()){
          allItems = [...allItems, ...alertsItems, ...automationItems, ...ssoItems]
        }
        if(func.checkOnPrem()){
          allItems = [...allItems, ...reportingItems]
        }
        return allItems;
    }
  }

    const handleCurrTab = (tab) =>{
      setCurrentItems(getTabItems(tab.id))
    }
    const handleTab = (tab)=>{
        navigate(tab)
    }

    function renderItem(item) {
        const {id, source, name} = item;
        const media = <Avatar customer size="medium" name={name} source={source}/>;
        const sourceActions = (item) => {
            return [
              {
                content: <div data-testid={`configure_${id}`}>Configure</div>,
                onClick: () => handleTab(item),
              },
            ];
          };
    
        return (
          <ResourceItem
            id={id}
            media={media}
            shortcutActions={sourceActions(id)}
            persistActions
          >
            <Text fontWeight="bold" as="h3">
              {name}
            </Text>
          </ResourceItem>
        );
      }

    function TabsList (){
        return(
            <ResourceList
                items={currItems}
                renderItem={renderItem}
                sortValue={sortValue}
                sortOptions={[
                    {label: 'Newest update', value: 'DATE_MODIFIED_DESC'},
                    {label: 'Oldest update', value: 'DATE_MODIFIED_ASC'},
                  ]}
                onSortChange={(selected) => {
                    setSortValue(selected);
                    console.log(`Sort option changed to ${selected}.`);
                }}
                headerContent={`Showing all Integrations`}
            />
        )
    }

    const cardComp = (
      <LegacyCard key="cardComp">
          <LayoutWithTabs tabs={tabs} currTab={handleCurrTab}/>
      </LegacyCard>
    )

    const components = [cardComp]
  return (
    <PageWithMultipleCards
      divider={true}
      components={components}
      title={
          <Text variant='headingLg' truncate>
              Integrations
          </Text>
      }
      isFirstPage={true}

    />
  )
}

export default Integrations