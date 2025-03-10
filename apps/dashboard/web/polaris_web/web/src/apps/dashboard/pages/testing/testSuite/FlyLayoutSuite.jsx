import { Button, HorizontalStack, Text, Box, Icon, TextField, Checkbox } from "@shopify/polaris"
import { EditMinor,SearchMinor } from '@shopify/polaris-icons';
import { useEffect, useMemo, useState } from "react";
import TestSuiteRow from "./TestSuiteRow";
import FlyLayout from "../../../components/layouts/FlyLayout";
import api from "../api";
import func from "../../../../../util/func";
import { debounce } from "lodash";
import LocalStore from "../../../../main/LocalStorageStore";
import transform from "./transform";

function FlyLayoutSuite(props) {
    const { show, setShow, selectedTestSuite, fetchTableData, createNewMode, setCreateNewMode } = props;
    const [testSuiteName, setTestSuiteName] = useState("");
    const [testSearchValue, setTestSearchValue] = useState("");
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);

    const handleExit = () => {
        setShow(false);
        setTestSearchValue("");
        setIsEditMode(false);
        if(createNewMode===true) setCreateNewMode(false);
    }

    const getFlyLayoutListRows = async () => {
        const subCategoryMap = await transform.getSubCategoryMap(LocalStore);
        const testSuiteSubCategoryMap = Object.values(subCategoryMap).map(tests => ({
            tests,
            displayName: tests[0]?.categoryName || "",
            selected: false
        }));
        return testSuiteSubCategoryMap;
    }


    const handleTestSuiteSave = async () => {
        if (!testSuiteName || testSuiteName.trim().length === 0) {
            func.setToast(true, true, "Test Suite Name cannot be empty");
            return;
        }
        let selectedTestSuiteTests = [];
        categories.forEach(element => {
            element.tests.forEach(test => {
                if (test.selected === true) {
                    selectedTestSuiteTests.push(test.value);
                }
            });

        });

        // check if the test suite has changed
        let hasChanged = false;
        if (testSuiteName !== selectedTestSuite?.testSuiteName) hasChanged = true;
        if (selectedTestSuite?.tests && !func.deepArrayComparison(selectedTestSuiteTests, selectedTestSuite?.tests)) {
            hasChanged = true;
        }

        try {
            if (selectedTestSuite && hasChanged && !selectedTestSuite.isAutoGenerated) {
                await api.modifyTestSuite(selectedTestSuite.id, testSuiteName, selectedTestSuiteTests);
                func.setToast(true, false, "Test suite has been updated successfully.");
            } else if(createNewMode === true || selectedTestSuite?.isAutoGenerated){ 
                // (1) is appended to avoid duplicate names for autogenerated test suites
                let name = (selectedTestSuite?.isAutoGenerated && testSuiteName === selectedTestSuite?.testSuiteName) ? testSuiteName + ' (1)'  : testSuiteName;
                await api.createNewTestSuite(name, selectedTestSuiteTests);
                func.setToast(true, false, "Test suite has been created successfully.");
            }
        } catch (error) {
            func.setToast(true, true, "An error occurred while saving the test suite.");
        }

        fetchTableData();
        handleExit();
    }


    const updateTestSuite = async () => {
        if (!selectedTestSuite?.tests) {
            setCategories([]);
            setTestSuiteName("");
            return;
        }
        
        const selectedTestSuiteTestsSet = new Set(selectedTestSuite.tests);

        // Updates the test suite categories and name state based on the selected test suite.  
        // This state is used to render rows in the flyout when not in edit mode.
        let testSuiteSubCategoryMap = await getFlyLayoutListRows();

        testSuiteSubCategoryMap = testSuiteSubCategoryMap.map((subCat) => {
            const filteredTests = subCat?.tests.filter(test => selectedTestSuiteTestsSet.has(test.value));
            if (filteredTests.length === 0) return null;
            return {
                ...subCat,
                tests: filteredTests,
            };
        }).filter(Boolean);
        // if (testSuiteSubCategoryMap.length > 0) {
        //     testSuiteSubCategoryMap[0].selected = testSuiteSubCategoryMap[0].tests.length > 0;
        // }
        

        setCategories(testSuiteSubCategoryMap);
        setTestSuiteName(selectedTestSuite.testSuiteName || "");
    };

    
    useEffect(() => {
        updateTestSuite();
    }, [selectedTestSuite]);

    useEffect(() => {
        if(createNewMode === true) {
            setIsEditMode(true);
        }
        else setIsEditMode(false);
    }, [createNewMode]);


    const filteredList = (value) =>{
        // Expands the row when a search is performed  
        // and updates setCategories, which in turn updates filteredCategories as a side effect.

        if (value.length > 0) {
            setCategories((prev) => {
                const updatedCategories = [...prev];
                updatedCategories.forEach(category => {
                    if (category.tests.some((test) => test.label.toLowerCase().includes(value.toLowerCase()))) {
                        category.selected = true;
                    }
                }
                );
                return updatedCategories;
            });
        }
        else {
            setCategories((prev) => {
                const updatedCategories = [...prev];
                updatedCategories.forEach(category => {
                    category.selected = false;
                }
                );
                return updatedCategories;
            });
        }
    }

    // filter the categories based on the search value
    useEffect(() => {
        let deepCopy = [];
        if (categories && Array.isArray(categories)) {
            deepCopy = JSON.parse(JSON.stringify(categories));
        }
        let updatedCategories = [...deepCopy];
        updatedCategories = updatedCategories.filter(category => {
            const tests = category.tests.filter(test =>
                test.label.toLowerCase().includes(testSearchValue.toLowerCase())
            );
            if(tests.length > 0){
                category.tests = tests;
                return true;
            }
            return false;
        });
        setFilteredCategories(updatedCategories);
    }, [categories]);


    async function handleSwitchMode() {
        if (!isEditMode) {
            updateTestSuite();
            return;
        }

        const testSuiteSubCategoryMap = await getFlyLayoutListRows();

        const selectedTestSet = new Set(selectedTestSuite?.tests);
        testSuiteSubCategoryMap.forEach(category => {
            category.tests.forEach(test => {
                test.selected = createNewMode ? true : selectedTestSet.has(test.value);
            });
        });

        setCategories(testSuiteSubCategoryMap);
    }

    useEffect(() => {
        handleSwitchMode();
    }, [isEditMode]);


    function checkExpand() {
        return filteredCategories.some(category => !category.selected);
    }

    const countSearchResults = () => {
        let count = 0;
        filteredCategories.forEach(category => { count += category.tests.length });
        return count;
    }

    const debouncedSearch = useMemo(() => debounce(filteredList, 500), []);

    useEffect(() => {
        return () => debouncedSearch.cancel();
    }, []);
    

    const handleSearchChange = (val) => {
        setTestSearchValue(val); 
        debouncedSearch(val); 
    };

    const headingComponents = (
        <Box borderColor="border-subdued" borderBlockStartWidth="1" borderBlockEndWidth="1" background="bg-subdued" padding={4}>
            <HorizontalStack blockAlign="end" align="space-between" wrap={false}>
                <Box width="40%" >
                    <TextField maxLength={64} showCharacterCount disabled={!isEditMode} value={testSuiteName} onChange={(val) => setTestSuiteName(val)} label="Test Suite Name" placeholder="Test Suite Name" />
                </Box>
                <Box width="58%" paddingBlockStart={6}>
                    <TextField value={testSearchValue} onChange={(val) => { handleSearchChange(val)}} prefix={<Icon source={SearchMinor} />} placeholder="Search" />
                </Box>
            </HorizontalStack>
        </Box>
    )

    function extendAllHandler() {
        setCategories(prev => {
            return prev.map(category => ({ ...category, selected: true }));
        });
    }

    function collapseAllHandler() {
        setCategories(prev => {
            return prev.map(category => ({ ...category, selected: false }));
        });
    }

    function totalSelectedTestsCount() {
        return filteredCategories.reduce((count, category) => count + category.tests.length, 0);
    }

    function switchMode() {
        setIsEditMode(!isEditMode);
    }

    function countSelectedTest(){
        let count = 0;
        categories.forEach(category => {
            category?.tests?.forEach(test => {
                if(test.selected){
                    count++;
                }
            });
        });
        return count>1 ? `${count} tests` : `${count} test`;
    }

    function countSelectedCategories(){
        let count = 0;
        categories.forEach(category => {
            if(category?.tests?.some(test => test.selected)) count++;
        });
        return count>1 ? `${count} categories` : `${count} category`;
    }

    function checkAllCategoriesSelected() {
        let atleastOne = false;
        let allSelected = true;
        const updatedCategories = [...filteredCategories];
        updatedCategories.forEach(element => {
            element.tests.forEach(test => {
                if (!test.selected) {
                    allSelected = false;
                }
                if (test.selected) {
                    atleastOne = true;
                }
            });
        });
        if (atleastOne && allSelected) return true;
        else if (atleastOne) return "indeterminate";
        else return false;
    }

    function selectAllCategories() {
        setCategories(prev => {
            const updatedCategories = [...prev];

            let someSelected = false;
            updatedCategories.forEach(element => {
                element.tests.some(test => {
                    if (test.selected) {
                        someSelected = true;
                    }
                });

            });

            const selectedFromFilterCategories = new Set();
            filteredCategories.forEach(element => {
                element.tests.forEach(test => {
                    selectedFromFilterCategories.add(test.value);
                });
            });

            updatedCategories.forEach(element => {
                element.tests.forEach(test => {
                    if (selectedFromFilterCategories.has(test.value))
                        test.selected = someSelected ? false : true;
                });

            });
            return updatedCategories;
        }
        );

    }

    const listComponents = (
        <div style={{ margin: "20px", borderRadius: "0.5rem", boxShadow: " 0px 0px 5px 0px #0000000D, 0px 1px 2px 0px #00000026" }}>
            <Box borderRadius="2" borderColor="border-subdued" >
                <Box borderColor="border-subdued" paddingBlockEnd={3} paddingBlockStart={3} paddingInlineStart={5} paddingInlineEnd={5}>
                    <HorizontalStack align="space-between">
                        <HorizontalStack align="start">
                            {(isEditMode)?<Checkbox checked={checkAllCategoriesSelected()} onChange={() => { selectAllCategories()}} />:null}
                            <Text color="subdued" fontWeight="semibold" as="h3">{testSearchValue.length > 0 ? `Showing ${countSearchResults()} result` : !isEditMode? `${filteredCategories.length} ${filteredCategories.length > 1 ? 'categories' : 'category'} & ${totalSelectedTestsCount()} tests` :`${countSelectedTest()} from ${countSelectedCategories()} selected`}</Text>
                        </HorizontalStack>
                        {testSearchValue.trim().length === 0 ? <Button onClick={() => { checkExpand() ? extendAllHandler() : collapseAllHandler() }} plain><Text>{checkExpand() ? "Expand all" : "Collapse all"}</Text></Button> : <></>}
                    </HorizontalStack>
                </Box>
                {filteredCategories.length > 0 && filteredCategories.map((category, index) => {
                    return (
                        <TestSuiteRow filteredCategories={filteredCategories} categories={categories} isEditMode={isEditMode} isLast={index === filteredCategories.length - 1} key={index} category={category} setCategories={setCategories} setFilteredCategories={setFilteredCategories} />
                    )
                })}
            </Box>
        </div>
    );

    const footer = isEditMode === true? (
        <div style={{ position: "fixed", bottom: "0px", opacity: "1", width: "100%", background: "white" }}>
            <Box borderColor="border-subdued" borderBlockStartWidth="1" padding={"4"} >
                <HorizontalStack align="space-between">
                    <Button primary onClick={() => {handleTestSuiteSave()}}>Save</Button>
                </HorizontalStack>
            </Box>
        </div>
    ):null;


    const components = [headingComponents, listComponents,footer].filter(Boolean);

    const titleComp = (
        <Box width="96%">
            <HorizontalStack align="space-between">

                <Text variant="headingMd">
                    Test Suite
                </Text>
                {selectedTestSuite && (
                    <Button icon={EditMinor} onClick={switchMode} plain></Button>
                )}
            </HorizontalStack>
        </Box>
    )



    return (
        <FlyLayout
            titleComp={titleComp}
            show={show}
            setShow={setShow}
            components={components}
            handleClose={handleExit}
            loading={false}
            showDivider={false}
            newComp={true}
            isHandleClose={true}
            switchMode={switchMode}
            variant={"testSuiteFlyout"}>
        </FlyLayout>
    )
}


export default FlyLayoutSuite;