import React, { useState } from 'react'
import TableStore from '../../tables/TableStore'
import { ChevronRightMinor, ChevronDownMinor } from "@shopify/polaris-icons"
import TooltipText from "../TooltipText";
import { Box, Checkbox, HorizontalStack, Icon } from '@shopify/polaris';

function PrettifyDisplayName({name, level, isTerminal, isOpen, selectItems, collectionIds}) {
    const selectedItems = TableStore.getState().selectedItems
    const [checked, setChecked] = useState(false)

    const checkedVal = collectionIds.every(id => selectedItems.includes(id))

    const handleNewItems = (collectionIds) => {
        
        if(checkedVal){
            return selectedItems.filter((x) => !collectionIds.includes(x))
        }else{
            return [...new Set([...selectedItems, ...collectionIds])]
        }
    }

    const handleChange = (collectionIds, selectItems) => {
        const newItems = handleNewItems(collectionIds)
        TableStore.getState().setSelectedItems(newItems)
        selectItems(newItems)
        setChecked(!checked)
    }

    const len = level.split("#").length - 1
    const spacingWidth = (len - 1) * 16;

    let displayName = name
    if(level !== undefined || level.length > 0){
        displayName = level.split("#")[len];
    }
    const icon = isOpen ? ChevronDownMinor : ChevronRightMinor
    return(
        <Box width='200px'>
            <div className="styled-name">
                <HorizontalStack gap={"2"} wrap={false}>
                    {spacingWidth > 0 ? <Box width={`${spacingWidth}px`} /> : null}
                    {len !== 0 ? <Checkbox checked={checkedVal} onChange={() => handleChange(collectionIds, selectItems)}/> : null}
                    {!isTerminal ? <Box><Icon source={icon} /></Box> : null}
                    <TooltipText text={displayName} tooltip={displayName} textProps={{variant: 'headingSm'}} />
                </HorizontalStack>
            </div>
        </Box>
    )
}

export default PrettifyDisplayName